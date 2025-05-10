import { Add, ArrowDropDown, ArrowDropUp, PlayArrow, Stop } from '@mui/icons-material';
import { Button, Collapse, IconButton, Paper, Stack } from '@mui/material';
import { useState } from 'react';
import useLocalStorageState from '../hooks/useLocalStorageState';
import AppCard, { AppMetaData } from './AppCard/AppCard';
import AppCardIcon from './AppCard/AppCardIcon';
import UsbSelect from './UsbSelect';

export default function Viewport() {
    const [appDataList, setAppDataList] = useLocalStorageState<AppMetaData[]>([], 'appDataList');
    const [expanded, setExpanded] = useState(false);

    return (
        <Stack height={'100vh'} >
            <Stack component={Paper} padding={2} gap={2}>
                <Stack direction="row" gap={2}>
                    <IconButton onClick={() => setExpanded(prev => !prev)} sx={{ alignSelf: 'center' }}>
                        {expanded ? <ArrowDropUp /> : <ArrowDropDown />}
                    </IconButton>
                    <Button size='small' startIcon={<Add />} variant='outlined' onClick={handleFileSelect}>Add App</Button>
                    <UsbSelect onSelectedUsbConnected={handleStartAll} onSelectedUsbDisconnected={handleStopAll} />
                    <Button size='small' startIcon={<PlayArrow />} variant='outlined' color="primary" onClick={handleStartAll}>Start All</Button>
                    <Button size='small' startIcon={<Stop />} variant='outlined' color="error" onClick={handleStopAll}>Stop All</Button>
                </Stack>
                <Collapse in={!expanded}>
                    <Stack direction={'row'} gap={1} flexWrap="wrap">
                        {appDataList.map(data => (
                            <AppCardIcon path={data.path} key={data.path} />
                        ))}
                    </Stack>
                </Collapse>
            </Stack>
            <Stack p={2}>
                <Collapse in={expanded} >
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
                </Collapse>
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
