import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { AppLiveData } from '../renderer/components/AppCard';

const handler = {
    send(channel: string, value: unknown) {
        ipcRenderer.send(channel, value);
    },
    on(channel: string, callback: (...args: unknown[]) => void) {
        const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
            callback(...args);
        ipcRenderer.on(channel, subscription);

        return () => {
            ipcRenderer.removeListener(channel, subscription);
        };
    },
    openFileDialog(): Promise<string[]> {
        return ipcRenderer.invoke('open-file-dialog');
    },
    getAppDetails(path: string): Promise<AppLiveData> {
        return ipcRenderer.invoke('get-app-details', path);
    },
    launchApp(path: string): Promise<void> {
        return ipcRenderer.invoke('launch-app', path);
    },
    stopApp(path: string): Promise<void> {
        return ipcRenderer.invoke('stop-app', path);
    },
    isAutoStartEnabled(): Promise<boolean> {
        return ipcRenderer.invoke('is-autostart-enabled');
    },
    setAutoStart(enable: boolean): Promise<void> {
        return ipcRenderer.invoke('set-autostart', enable);
    }
};

contextBridge.exposeInMainWorld('ipc', handler);

export type IpcHandler = typeof handler;
