import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const handler = {
    send(channel: string, value: unknown) {
        ipcRenderer.send(channel, value);
    },
    on(channel: string, callback: (...args: unknown[]) => void) {
        const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args);
        ipcRenderer.on(channel, subscription);

        return () => {
            ipcRenderer.removeListener(channel, subscription);
        };
    },
    openFileDialog(): Promise<string[]> {
        return ipcRenderer.invoke('open-file-dialog');
    },
    getAppIcon(path: string): Promise<string> {
        return ipcRenderer.invoke('get-app-icon', path);
    },
    isAppRunning(path: string): Promise<boolean> {
        return ipcRenderer.invoke('is-app-running', path);
    },
    launchApp(path: string[]): Promise<void> {
        return ipcRenderer.invoke('launch-app', path);
    },
    stopApp(path: string[]): Promise<void> {
        return ipcRenderer.invoke('stop-app', path);
    },
    isAutoStartEnabled(): Promise<boolean> {
        return ipcRenderer.invoke('is-autostart-enabled');
    },
    setAutoStart(enable: boolean): Promise<void> {
        return ipcRenderer.invoke('set-autostart', enable);
    },
    getRunningProcesses(search: string): Promise<{ name: string, path: string }[]> {
        return ipcRenderer.invoke('get-running-processes', search);
    },
    setUsbActive() {
        ipcRenderer.invoke('set-usb-active');
    },
    setUsbInactive() {
        ipcRenderer.invoke('set-usb-inactive');
    },
};

contextBridge.exposeInMainWorld('ipc', handler);

export type IpcHandler = typeof handler;
