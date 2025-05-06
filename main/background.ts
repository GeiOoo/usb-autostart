import { exec, spawn } from 'child_process';
import { app, dialog, ipcMain, Menu, nativeImage, Tray } from 'electron';
import serve from 'electron-serve';
import path from 'path';
import { AppLiveData } from '../renderer/components/AppCard';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';
const APP_NAME = 'USB AutoStart';

// Function to enable/disable autostart
async function setAutoStart(enable: boolean): Promise<void> {
    const appPath = app.getPath('exe');
    const command = enable ?
        `REG ADD "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /V "${APP_NAME}" /t REG_SZ /F /D "${appPath}"` :
        `REG DELETE "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /V "${APP_NAME}" /F`;

    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

// Function to check if autostart is enabled
async function isAutoStartEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
        exec(
            `REG QUERY "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /V "${APP_NAME}"`,
            (error) => {
                resolve(!error); // If there's no error, the registry key exists
            }
        );
    });
}

if (isProd) {
    serve({ directory: 'app' });
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`);
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

let tray: Tray | null = null;
let mainWindow: ReturnType<typeof createWindow>;

; (async () => {
    await app.whenReady();

    mainWindow = createWindow('main', {
        title: 'USB-AutoStart',
        width: 1400,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Create tray icon
    let iconPath;
    if (isProd) {
        // In production, the icon will be in the same directory as the executable
        iconPath = path.join(process.resourcesPath, 'icon.ico');
    } else {
        iconPath = path.join(__dirname, '../resources/icon.ico');
    }

    if (!tray) {
        const icon = nativeImage.createFromPath(iconPath);
        tray = new Tray(icon);
    }

    // Get initial autostart state
    const autoStartEnabled = await isAutoStartEnabled();

    const updateContextMenu = async () => {
        const autoStartEnabled = await isAutoStartEnabled();
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show Window',
                click: () => mainWindow.show()
            },
            {
                label: 'Start with Windows',
                type: 'checkbox',
                checked: autoStartEnabled,
                click: async () => {
                    try {
                        await setAutoStart(!autoStartEnabled);
                        // Update the menu to reflect the new state
                        updateContextMenu();
                    } catch (error) {
                        dialog.showErrorBox('Error', 'Failed to update startup settings');
                    }
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                click: () => {
                    mainWindow.destroy();
                    app.quit();
                }
            }
        ]);

        tray.setContextMenu(contextMenu);
    };

    // Initial menu setup
    await updateContextMenu();

    // Handle tray icon click
    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });

    // Handle window close button
    mainWindow.on('close', (event) => {
        if (isProd) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    // Set up USB device permission handler 
    mainWindow.webContents.session.setDevicePermissionHandler((details) => {
        if (details.deviceType === 'usb') {
            return true; // Allow USB device access
        }
        return false;
    });

    if (isProd) {
        await mainWindow.loadURL('app://./home');
    } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/home`);
        mainWindow.webContents.openDevTools();
    }
})();

app.on('window-all-closed', () => {
    if (tray) tray.destroy();
    app.quit();
});

ipcMain.on('message', async (event, arg) => {
    event.reply('message', `${arg} World!`);
});

ipcMain.handle('open-file-dialog', async (): Promise<string[]> => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
    });

    return result?.filePaths ?? [];
});

ipcMain.handle('get-app-details', async (event, path: string): Promise<AppLiveData> => {
    const fileName = path.split('\\').pop() || 'Unknown';
    const processName = fileName.replace(/\.[^/.]+$/, "");

    let isRunning = false;
    try {
        isRunning = await new Promise((resolve) => {
            // Use proper PowerShell command syntax
            exec(`powershell -Command "Get-Process -Name \\"${processName}\\" -ErrorAction SilentlyContinue"`, (error, stdout) => {
                resolve(stdout.length > 0);
            });
        });
    } catch {
        isRunning = false;
    }

    return {
        icon: await app.getFileIcon(path, { size: 'large' }),
        isRunning
    };
});

ipcMain.handle('launch-app', async (_event, path: string) => {
    const fileName = path.split('\\').pop() || '';
    const processName = fileName.replace(/\.[^/.]+$/, "");

    // Check if already running
    try {
        const isRunning = await new Promise<boolean>((resolve) => {
            // Use proper PowerShell command syntax
            exec(`powershell -Command "Get-Process -Name \\"${processName}\\" -ErrorAction SilentlyContinue"`, (error, stdout) => {
                resolve(stdout.length > 0);
            });
        });

        if (isRunning) {
            return; // Process already running
        }
    } catch {
        // Process not running, continue with launch
    }

    spawn(path, [], {
        detached: true,
        stdio: 'ignore'
    }).unref(); // Unref to allow the child to run independently
});

ipcMain.handle('stop-app', async (_event, path: string) => {
    const fileName = path.split('\\').pop() || '';
    const processName = fileName.replace(/\.[^/.]+$/, "");

    return new Promise((resolve) => {
        // Use proper PowerShell command syntax
        exec(`powershell -Command "Stop-Process -Name \\"${processName}\\" -ErrorAction SilentlyContinue"`, (error) => {
            resolve(null);
        });
    });
});

// Add new IPC handlers for autostart
ipcMain.handle('is-autostart-enabled', async () => {
    return isAutoStartEnabled();
});

ipcMain.handle('set-autostart', async (_event, enable: boolean) => {
    return setAutoStart(enable);
});
