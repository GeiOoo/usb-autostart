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
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
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
    console.log({ path });

    return {
        name: path.split('\\').pop() || 'Unknown',
        path,
        icon: await app.getFileIcon(path, { size: 'large' }),
    };
});
