import { AppLiveData } from '@/src/components/AppGroup/AppCard/AppCard';
import { exec, spawn } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
        icon: path.join(process.env.VITE_PUBLIC!, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
    });

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
    // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'));
    }
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

app.whenReady().then(createWindow);

ipcMain.handle('open-file-dialog', async (): Promise<string[]> => {
    const result = await dialog.showOpenDialog({
        properties: [ 'openFile', 'multiSelections' ],
    });

    return result?.filePaths ?? [];
});

ipcMain.handle('get-app-details', async (_event, paths: string[]): Promise<AppLiveData[]> => {
    const processInfos = getProcessInfoFromPaths(paths);
    const runningProcesses = await getRunningProcesses(processInfos.map(info => info.processName));

    return Promise.all(
        processInfos.map(async ({ path, processName }) => ({
            icon: (await app.getFileIcon(path, { size: 'large' })).toDataURL(),
            isRunning: runningProcesses.has(processName),
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
ipcMain.handle('get-running-processes', async (_event, search: string): Promise<{ name: string, path: string }[]> => {
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

        if (!stdout.trim()) { return []; }

        const processes: { name: string, path: string }[] = JSON.parse(stdout);
        if (!Array.isArray(processes)) {
            return processes ? [ processes ] : [];
        }

        // If there's no search, return all processes
        if (!search) { return processes; }

        // Do case-insensitive search once
        const searchLower = search.toLowerCase();
        return processes.filter(p => p.name.toLowerCase().includes(searchLower) ||
            p.path.toLowerCase().includes(searchLower)
        );
    } catch (error) {
        console.error('Error getting processes:', error);
        return [];
    }
});

const isProd = process.env.NODE_ENV === 'production';
const APP_NAME = 'USB AutoStart';

// Helper function to execute PowerShell commands
function executePsCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`powershell -Command "${command}"`, (error, stdout) => {
            if (error) { reject(error); }
            else { resolve(stdout.trim()); }
        });
    });
}

// Helper function to get process info from paths
function getProcessInfoFromPaths(paths: string[] | string) {
    const pathArray = Array.isArray(paths) ? paths : [ paths ];
    return pathArray.map(path => ({
        path,
        // Convert to lowercase for case-insensitive comparison
        processName: path.split('\\').pop()?.replace(/\.[^/.]+$/, '').toLowerCase() || 'unknown',
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
