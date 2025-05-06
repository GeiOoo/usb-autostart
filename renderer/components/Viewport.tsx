import { Add, PlayArrow, Stop } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import useLocalStorageState from '../hooks/useLocalStorageState';
import AppCard, { AppMetaData } from './AppCard';
import UsbSelect from './UsbSelect';

export default function Viewport() {
    const [appDataList, setAppDataList] = useLocalStorageState<AppMetaData[]>([], 'appDataList');

    return (
        <Stack gap={2} padding={2} height={'100vh'}>
            <Stack direction="row" gap={2}>
                <Button startIcon={<Add />} variant='outlined' onClick={handleFileSelect}>Add App</Button>
                <UsbSelect onSelectedUsbConnected={handleStartAll} onSelectedUsbDisconnected={handleStopAll} />
                <Button startIcon={<PlayArrow />} variant='outlined' color="primary" onClick={handleStartAll}>Start All</Button>
                <Button startIcon={<Stop />} variant='outlined' color="error" onClick={handleStopAll}>Stop All</Button>
            </Stack>
            <Stack overflow={'auto'} direction={'row'} gap={2} flexWrap="wrap" alignItems={'baseline'}>
                {appDataList.map(data => <AppCard key={data.path} data={data} onDeleteApp={handleDeleteApp} />)}
            </Stack>
        </Stack>
    );

    async function handleFileSelect() {
        const paths = await window.ipc.openFileDialog();
        setAppDataList(prev => {
            const newPaths = paths.filter(p => !prev.some(app => app.path === p));
            return [...prev, ...newPaths.map(path => ({
                name: path.split('\\').pop() || '',
                path
            }))];
        });
    };

    function handleDeleteApp(path: string) {
        setAppDataList(prev => prev.filter(app => app.path !== path));
    }

    async function handleStartAll() {
        for (const data of appDataList) {
            await window.ipc.launchApp(data.path);
        }
    }

    async function handleStopAll() {
        for (const data of appDataList) {
            await window.ipc.stopApp(data.path);
        }
    }
}
