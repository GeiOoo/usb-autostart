import { ArrowDropDown, ArrowDropUp, PlayArrow, Stop } from '@mui/icons-material';
import { Button, Collapse, IconButton, Paper, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { db } from '../../db/db';
import useLocalStorageState from '../../hooks/useLocalStorageState';
import UsbSelect from '../UsbSelect';
import AddApplications from './AddApplications/AddApplications';
import AppCard, { AppMetaData } from './AppCard/AppCard';
import AppCardIcon from './AppCard/AppCardIcon';

export default function AppGroup() {
    const [ expanded, setExpanded ] = useState(false);
    const [ appDataList, setAppDataList ] = useLocalStorageState<AppMetaData[]>([], 'appDataList');

    const { data: appList, isPlaceholderData } = useQuery({
        placeholderData: appDataList.map(data => ({
            data,
            process: {
                icon: '',
                isRunning: false,
            },
        })),
        queryKey: [ 'appDetails' ],
        queryFn: async () => {
            const processList = await window.ipc.getAppListDetails(appDataList.map(app => app.path));
            return appDataList.map((data, index) => ({
                data,
                process: processList[index],
            }));
        },
        refetchOnWindowFocus: false,
        refetchInterval: 1000,
    });

    const sortedAppList = useMemo(() => {
        return appList?.sort((a, b) => a.data.name.localeCompare(b.data.name)) ?? [];
    }, [ appList ]);

    return (
        <Stack height={'100vh'}>
            <Stack component={Paper} gap={2} padding={2}>
                <Stack alignItems={'center'} direction="row" gap={2}>
                    <IconButton onClick={() => setExpanded(prev => !prev)} sx={{ alignSelf: 'center' }}>
                        {expanded ? <ArrowDropUp /> : <ArrowDropDown />}
                    </IconButton>
                    <AddApplications onAddApps={handleAddApp} />
                    <UsbSelect onSelectedUsbConnected={handleStartAll} onSelectedUsbDisconnected={handleStopAll} />
                    <Button
                        color="primary"
                        onClick={handleStartAll}
                        size="small"
                        startIcon={<PlayArrow />}
                        variant="outlined"
                    >Start All
                    </Button>
                    <Button
                        color="error"
                        onClick={handleStopAll}
                        size="small"
                        startIcon={<Stop />}
                        variant="outlined"
                    >Stop All
                    </Button>
                </Stack>
                <Collapse in={!expanded}>
                    <Stack direction={'row'} flexWrap="wrap" gap={1}>
                        {sortedAppList.map(app => (
                            <AppCardIcon key={app.data.name} isLoading={isPlaceholderData} processData={app.process} />
                        ))}
                    </Stack>
                </Collapse>
            </Stack>
            <Stack p={2}>
                <Collapse in={expanded}>
                    <Stack
                        alignItems={'baseline'}
                        direction={'row'}
                        flexWrap="wrap"
                        gap={2}
                        overflow={'auto'}
                    >
                        {sortedAppList
                            .map(app => (
                                <AppCard
                                    key={app.data.path}
                                    data={app.data}
                                    isLoading={isPlaceholderData}
                                    onDeleteApp={handleDeleteApp}
                                    processData={app.process}
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

    function handleDeleteApp(path: string) {
        setAppDataList(prev => prev.filter(app => app.path !== path));
    }

    async function handleStartAll() {
        await window.ipc.launchApp(appDataList.map(data => data.path));
    }

    async function handleStopAll() {
        await window.ipc.stopApp(appDataList.map(data => data.path));
    }

    async function handleAddApp(paths?: string[]) {
        const pathList = paths ?? await window.ipc.openFileDialog();
        const appList = pathList
            .filter(path => path && !appDataList.some(app => app.path === path))
            .map(path => ({
                name: path.split('\\').pop() || '',
                path,
            }));

        setAppDataList(prev => ([ ...prev, ...appList ]));
        await db.app.bulkAdd(appList);
    }
}
