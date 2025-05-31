import { app, BrowserWindow, Menu, Tray } from 'electron';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import registerIpcHandler from './registerIpcHandler';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');

export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const { VITE_DEV_SERVER_URL } = process.env;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC!, 'icon.ico'),
        width: 1400,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
    });

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    win.webContents.session.setDevicePermissionHandler((details) => {
        if (details.deviceType === 'usb') {
            return true;
        }
        return false;
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
    // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'));
    }
}

const lock = app.requestSingleInstanceLock();
if (!lock) {
    app.quit();
} else {
    // If the app is already running, focus the existing window
    app.on('second-instance', () => {
        if (win) {
            if (win.isMinimized()) { win.restore(); }
            win.show();
            win.focus();
        }
    });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        win = null;
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.whenReady().then(createWindow).then(() => {
    const tray = new Tray(path.join(process.env.VITE_PUBLIC!, 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([ {
        label: 'Open App',
        click: () => {
            if (win) {
                if (win.isMinimized()) { win.restore(); }
                win.show();
                win.focus();
            }
        },
    }, {
        label: 'Quit',
        click: () => {
            app.quit();
        },
    } ]);
    tray.on('click', () => {
        if (win) {
            if (win.isMinimized()) { win.restore(); }
            win.show();
            win.focus();
        }
    });
    tray.setToolTip('Electron App');
    tray.setContextMenu(contextMenu);
});

registerIpcHandler(app);
