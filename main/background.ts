import { exec, spawn } from 'child_process';
import { app, dialog, ipcMain, Menu, nativeImage, Tray } from 'electron';
import serve from 'electron-serve';
import path from 'path';
import { AppLiveData } from '../renderer/components/AppGroup/AppCard/AppCard';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';
const APP_NAME = 'USB AutoStart';

// Helper function to execute PowerShell commands
async function executePsCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`powershell -Command "${command}"`, (error, stdout) => {
            if (error) reject(error);
            else resolve(stdout.trim());
        });
    });
}

// Helper function to get process info from paths
function getProcessInfoFromPaths(paths: string[] | string) {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    return pathArray.map(path => ({
        path,
        // Convert to lowercase for case-insensitive comparison
        processName: path.split('\\').pop()?.replace(/\.[^/.]+$/, "").toLowerCase() || 'unknown'
    }));
}

// Helper function to check running processes
async function getRunningProcesses(processNames: string[]): Promise<Set<string>> {
    try {
        // Convert process names to lowercase and wrap in quotes
        const processNamesArray = processNames.map(name => `'${name.toLowerCase()}'`).join(',');
        // Use -ErrorAction SilentlyContinue to suppress errors and Select Name to get just the process names
        const stdout = await executePsCommand(`Get-Process | Select-Object -ExpandProperty ProcessName | ForEach-Object { $_.ToLower() } | Where-Object { @(${processNamesArray}) -contains $_ }`);

        // Split output and create set of running processes
        return new Set(stdout.split('\n')
            .map(line => line.trim().toLowerCase())
            .filter(Boolean));
    } catch {
        return new Set();
    }
}

// Function to enable/disable autostart
async function setAutoStart(enable: boolean): Promise<void> {
    const appPath = app.getPath('exe');
    const command = enable
        ? `REG ADD "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /V "${APP_NAME}" /t REG_SZ /F /D "${appPath}"`
        : `REG DELETE "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /V "${APP_NAME}" /F`;

    await executePsCommand(command);
}

// Function to check if autostart is enabled
async function isAutoStartEnabled(): Promise<boolean> {
    try {
        await executePsCommand(`REG QUERY "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /V "${APP_NAME}"`);
        return true;
    } catch {
        return false;
    }
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

    await executePsCommand('npx prisma migrate deploy');

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

    async function updateContextMenu() {
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
    }

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

ipcMain.handle('get-app-details', async (_event, paths: string[]): Promise<AppLiveData[]> => {
    const processInfos = getProcessInfoFromPaths(paths);
    const runningProcesses = await getRunningProcesses(processInfos.map(info => info.processName));

    return Promise.all(
        processInfos.map(async ({ path, processName }) => ({
            icon: (await app.getFileIcon(path, { size: 'large' })).toDataURL(),
            isRunning: runningProcesses.has(processName)
        }))
    );
});

ipcMain.handle('launch-app', async (_event, paths: string[] | string) => {
    const processInfos = getProcessInfoFromPaths(paths);
    const runningProcesses = await getRunningProcesses(processInfos.map(info => info.processName));

    processInfos.forEach(({ path, processName }) => {
        if (!runningProcesses.has(processName)) {
            spawn(path, [], { detached: true, stdio: 'ignore' }).unref();
        }
    });
});

ipcMain.handle('stop-app', async (_event, paths: string[] | string) => {
    const processInfos = getProcessInfoFromPaths(paths);
    const processNamesArray = processInfos.map(info => `'${info.processName}'`).join(',');

    try {
        await executePsCommand(`$processes = @(${processNamesArray}); Stop-Process -Name $processes -ErrorAction SilentlyContinue`);
    } catch {
        // Ignore errors when stopping processes
    }
});

// Add new IPC handlers for autostart
ipcMain.handle('is-autostart-enabled', isAutoStartEnabled);
ipcMain.handle('set-autostart', (_event, enable: boolean) => setAutoStart(enable));
ipcMain.handle('get-running-processes', async (_event, search: string): Promise<{ name: string, path: string; }[]> => {
    try {
        const command = `
            Get-Process | Where-Object { 
                $null -ne $_.Path -and 
                $_.Path -like '*.exe' -and 
                $_.Path -notlike '*\\Windows\\*' -and 
                $_.Path -notlike '*\\Microsoft.NET\\*' 
            } | 
            Group-Object -Property Path | 
            ForEach-Object {
                $process = $_.Group[0]; 
                @{
                    name = ($process.ProcessName);
                    path = $process.Path;
                }
            } | 
            ConvertTo-Json -Compress
        `.replace(/\s+/g, ' ').trim();

        const stdout = await executePsCommand(command);

        if (!stdout.trim()) return [];

        const processes: { name: string; path: string; }[] = JSON.parse(stdout);
        if (!Array.isArray(processes)) {
            return processes ? [processes] : [];
        }

        // If there's no search, return all processes
        if (!search) return processes;

        // Do case-insensitive search once
        const searchLower = search.toLowerCase();
        return processes.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.path.toLowerCase().includes(searchLower)
        );
    } catch (error) {
        console.error('Error getting processes:', error);
        return [];
    }
});
