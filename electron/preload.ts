import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IpcHandlerClient } from './registerIpcHandler';

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
    async callAction<T extends keyof IpcHandlerClient>(action: T, ...args: Parameters<IpcHandlerClient[T]>): Promise<ReturnType<IpcHandlerClient[T]>> {
        return await ipcRenderer.invoke(action, ...args);
    },
};

contextBridge.exposeInMainWorld('ipc', handler);

export type IpcHandler = typeof handler;
