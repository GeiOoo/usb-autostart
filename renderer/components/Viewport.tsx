import { Add, ArrowDropDown, ArrowDropUp, PlayArrow, Stop } from '@mui/icons-material';
import { Button, Collapse, IconButton, Paper, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import useLocalStorageState from '../hooks/useLocalStorageState';
import AppCard, { AppMetaData } from './AppCard/AppCard';
import AppCardIcon from './AppCard/AppCardIcon';
import UsbSelect from './UsbSelect';

export default function AppGroup() {
    const [expanded, setExpanded] = useState(false);
    const [appDataList, setAppDataList] = useLocalStorageState<AppMetaData[]>([], 'appDataList');

    const { data: appList, isLoading } = useQuery({
        initialData: [],
        queryKey: ['appDetails'],
        queryFn: async () => {
            return await Promise.all(appDataList.map(async data => ({
                data,
                process: await window.ipc.getAppDetails(data.path)
            })));
        },
        refetchOnWindowFocus: false,
        refetchInterval: 1000,
        select: data => {
            return data.map(app => ({
                ...app,
                data: {
                    ...app.data
                },
                process: {
                    ...app.process,
                }
            }));
        }
    });


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
                        {appList.map(app => (
                            <AppCardIcon isLoading={isLoading} processData={app.process as any} key={app.data.name} />
                        ))}
                    </Stack>
                </Collapse>
            </Stack>
            <Stack p={2}>
                <Collapse in={expanded} >
                    <Stack overflow={'auto'} direction={'row'} gap={2} flexWrap="wrap" alignItems={'baseline'}>
                        {appList
                            .toSorted((a, b) => a.data.name.localeCompare(b.data.name))
                            .map(app => (
                                <AppCard
                                    key={app.data.path}
                                    data={app.data}
                                    isLoading={isLoading}
                                    processData={app.process}
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
