import { app, BrowserWindow, Menu, Tray } from 'electron';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import registerIpcHandler from './registerIpcHandler';

const isProd = process.env.VITE_DEV_SERVER_URL === undefined;
export const APP_NAME = 'USB AutoStart';

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

// Add isQuitting flag at the top level
let isQuitting = false;
let tray: Tray;

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
        width: 1400,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
    });

    // Minimize to tray instead of closing
    win.on('close', (event) => {
        if (tray && !isQuitting) {
            event.preventDefault();
            win?.hide();
        }
        return false;
    });

    // Handle minimize event
    win.on('minimize', () => {
        win?.hide();
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
    if (!isProd) {
        return;
    }

    tray = new Tray(path.join(process.env.VITE_PUBLIC!, 'favicon.ico'));

    // Function to update the context menu
    const updateContextMenu = () => {
        const startWithWindows = app.getLoginItemSettings().openAtLogin;
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
            label: 'Start with Windows',
            type: 'checkbox',
            checked: startWithWindows,
            click: () => {
                const currentSetting = app.getLoginItemSettings().openAtLogin;
                app.setLoginItemSettings({
                    openAtLogin: !currentSetting,
                    path: app.getPath('exe'),
                });
                updateContextMenu(); // Update the menu to reflect the new state
            },
        }, {
            type: 'separator',
        }, {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            },
        } ]);
        tray.setContextMenu(contextMenu);
    };

    // Initialize the context menu
    updateContextMenu();

    tray.on('click', () => {
        if (win) {
            if (win.isMinimized()) { win.restore(); }
            win.show();
            win.focus();
        }
    });
    tray.setToolTip('Electron App');
});

registerIpcHandler(app);
