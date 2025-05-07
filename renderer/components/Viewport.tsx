import { Add, PlayArrow, Stop } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import useLocalStorageState from '../hooks/useLocalStorageState';
import AppCard, { AppMetaData } from './AppCard/AppCard';
import UsbSelect from './UsbSelect';

export default function Viewport() {
    const [appDataList, setAppDataList] = useLocalStorageState<AppMetaData[]>([], 'appDataList');

    return (
        <Stack gap={2} padding={2} height={'100vh'}>
            <Stack direction="row" gap={2}>
                <Button size='small' startIcon={<Add />} variant='outlined' onClick={handleFileSelect}>Add App</Button>
                <UsbSelect onSelectedUsbConnected={handleStartAll} onSelectedUsbDisconnected={handleStopAll} />
                <Button size='small' startIcon={<PlayArrow />} variant='outlined' color="primary" onClick={handleStartAll}>Start All</Button>
                <Button size='small' startIcon={<Stop />} variant='outlined' color="error" onClick={handleStopAll}>Stop All</Button>
            </Stack>
            <Stack overflow={'auto'} direction={'row'} gap={2} flexWrap="wrap" alignItems={'baseline'}>
                {appDataList
                    .toSorted((a, b) => a.name.localeCompare(b.name))
                    .map(data => (
                        <AppCard
                            key={data.path}
                            data={data}
                            onDeleteApp={handleDeleteApp}
                            onUpdateAppMetaData={(oldPath, newData) => {
                                setAppDataList(prev => prev.map(app => app.path === oldPath ? newData : app));
                            }}
                        />
                    ))}
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
