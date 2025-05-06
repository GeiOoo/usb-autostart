import { Add, PlayArrow, Stop } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import useLocalStorageState from '../hooks/useLocalStorageState';
import AppCard from './AppCard';
import UsbSelect from './UsbSelect';

export default function Viewport() {
    const [appPathList, setAppPathList] = useLocalStorageState<string[]>([], 'appPathList');

    return (
        <Stack gap={2} padding={2} height={'100vh'}>
            <Stack direction="row" gap={2}>
                <Button startIcon={<Add />} variant='outlined' onClick={handleFileSelect}>Add App</Button>
                <UsbSelect onSelectedUsbConnected={handleStartAll} onSelectedUsbDisconnected={handleStopAll} />
                <Button startIcon={<PlayArrow />} variant='outlined' color="primary" onClick={handleStartAll}>Start All</Button>
                <Button startIcon={<Stop />} variant='outlined' color="error" onClick={handleStopAll}>Stop All</Button>
            </Stack>
            <Stack direction={'row'} gap={2} flexWrap="wrap" alignItems={'baseline'}>
                {appPathList.map(path => <AppCard key={path} path={path} onDeleteApp={handleDeleteApp} />)}
            </Stack>
        </Stack>
    );

    async function handleFileSelect() {
        const path = await window.ipc.openFileDialog();
        setAppPathList(prev => [...prev, path]);
    };

    function handleDeleteApp(path: string) {
        setAppPathList(prev => prev.filter(p => p !== path));
    }

    async function handleStartAll() {
        for (const path of appPathList) {
            await window.ipc.launchApp(path);
        }
    }

    async function handleStopAll() {
        for (const path of appPathList) {
            await window.ipc.stopApp(path);
        }
    }
}
