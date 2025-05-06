import { execSync, spawn } from 'child_process';
import { app, dialog, ipcMain } from 'electron';
import serve from 'electron-serve';
import path from 'path';
import { AppData } from '../renderer/components/AppCard';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
    serve({ directory: 'app' });
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`);
}


; (async () => {
    await app.whenReady();

    const mainWindow = createWindow('main', {
        width: 1400,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
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
    app.quit();
});

ipcMain.on('message', async (event, arg) => {
    event.reply('message', `${arg} World!`);
});

ipcMain.handle('open-file-dialog', async (): Promise<string> => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
    });

    return result?.filePaths[0];
});

ipcMain.handle('get-app-details', async (event, path: string): Promise<AppData> => {
    const fileName = path.split('\\').pop() || 'Unknown';
    const processName = fileName.replace(/\.[^/.]+$/, "");

    let isRunning = false;
    try {
        const stdout = execSync(`powershell Get-Process "${processName}" -ErrorAction SilentlyContinue`);
        isRunning = stdout.length > 0;
    } catch {
        isRunning = false;
    }

    return {
        name: path.split('\\').pop() || 'Unknown',
        path,
        icon: await app.getFileIcon(path, { size: 'large' }),
        isRunning
    };
});

ipcMain.handle('launch-app', async (_event, path: string) => {
    const fileName = path.split('\\').pop() || '';
    const processName = fileName.replace(/\.[^/.]+$/, "");

    // Check if already running
    try {
        const stdout = execSync(`powershell Get-Process "${processName}" -ErrorAction SilentlyContinue`);
        if (stdout.length > 0) {
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

    try {
        execSync(`powershell Stop-Process -Name "${processName}" -ErrorAction SilentlyContinue`);
    } catch {
        // Process might already be stopped
    }
});
