import { exec, spawn } from 'child_process';
import { app, dialog, ipcMain } from 'electron';
import path from 'path';
import { APP_NAME } from './main';

export type IpcHandlerClient = ReturnType<typeof registerIpcHandler>;

export default function registerIpcHandler(win: Electron.BrowserWindow | null, tray: Electron.Tray | null) {
    const actions = {
        setUsbActive() {
            tray?.setImage(path.join(process.env.VITE_PUBLIC!, 'favicon_active.ico'));
            win?.setIcon(path.join(process.env.VITE_PUBLIC!, 'favicon_active.ico'));
        },
        setUsbInactive() {
            tray?.setImage(path.join(process.env.VITE_PUBLIC!, 'favicon.ico'));
            win?.setIcon(path.join(process.env.VITE_PUBLIC!, 'favicon.ico'));
        },
        async openFileDialog(): Promise<string[]> {
            const result = await dialog.showOpenDialog({
                properties: [ 'openFile', 'multiSelections' ],
            });
            return result?.filePaths ?? [];
        },
        async getAppIcon(filePath: string): Promise<string> {
            return (await app.getFileIcon(filePath, { size: 'large' })).toDataURL();
        },
        async isAppRunning(filePath: string): Promise<boolean> {
            const [ processInfo ] = getProcessInfoFromPaths(filePath);
            const runningProcesses = await getRunningProcesses([ processInfo.processName ]);
            return runningProcesses.has(processInfo.processName);
        },
        async launchApp(paths: string[] | string) {
            const processInfos = getProcessInfoFromPaths(paths);
            const runningProcesses = await getRunningProcesses(processInfos.map(info => info.processName));

            processInfos.forEach(({ path, processName }) => {
                if (!runningProcesses.has(processName)) {
                    spawn(path, [], { detached: true, stdio: 'ignore' }).unref();
                }
            });
        },
        async stopApp(paths: string[] | string) {
            const processInfos = getProcessInfoFromPaths(paths);
            const processNamesArray = processInfos.map(info => `'${info.processName}'`).join(',');

            try {
                await executePsCommand(`$processes = @(${processNamesArray}); Stop-Process -Name $processes -ErrorAction SilentlyContinue`);
            } catch {}
        },
        async isAutoStartEnabled(): Promise<boolean> {
            try {
                await executePsCommand(`REG QUERY "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /V "${APP_NAME}"`);
                return true;
            } catch {
                return false;
            }
        },
        async setAutoStart(enable: boolean): Promise<void> {
            const appPath = app.getPath('exe');
            const command = enable
                ? `REG ADD "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /V "${APP_NAME}" /t REG_SZ /F /D "${appPath}"`
                : `REG DELETE "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /V "${APP_NAME}" /F`;

            await executePsCommand(command);
        },
        async getRunningProcesses(search: string): Promise<{ name: string, path: string }[]> {
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
        },
    } as const;

    Object.entries(actions).forEach(([ actionName, action ]) => {
        ipcMain.handle(actionName, (_event: Electron.IpcMainInvokeEvent, ...args: any[]) => (action as (...a: typeof args) => void)(...args));
    });

    return actions;
}

function executePsCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`powershell -Command "${command}"`, (error, stdout) => {
            if (error) { reject(error); }
            else { resolve(stdout.trim()); }
        });
    });
}

function getProcessInfoFromPaths(paths: string[] | string) {
    const pathArray = Array.isArray(paths) ? paths : [ paths ];
    return pathArray.map(path => ({
        path,
        processName: path.split('\\').pop()?.replace(/\.[^/.]+$/, '').toLowerCase() || 'unknown',
    }));
}

async function getRunningProcesses(processNames: string[]): Promise<Set<string>> {
    try {
        const processNamesArray = processNames.map(name => `'${name.toLowerCase()}'`).join(',');
        const stdout = await executePsCommand(`Get-Process | Select-Object -ExpandProperty ProcessName | ForEach-Object { $_.ToLower() } | Where-Object { @(${processNamesArray}) -contains $_ }`);

        return new Set(stdout.split('\n')
            .map(line => line.trim().toLowerCase())
            .filter(Boolean));
    } catch {
        return new Set();
    }
}
