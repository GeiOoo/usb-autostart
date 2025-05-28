import { ArrowDropDown, ArrowDropUp, PlayArrow, Stop } from '@mui/icons-material';
import { Button, Collapse, IconButton, Paper, Stack } from '@mui/material';
import { Prisma } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import UsbSelect from '../UsbSelect';
import AddAppSection from './AddAppSection';
import AppCard from './AppCard/AppCard';
import AppCardIcon from './AppCard/AppCardIcon';

export default function AppGroup() {
    const [expanded, setExpanded] = useState(false);

    const { data, refetch, isPlaceholderData: basePlaceholderData } = useQuery({
        queryFn: async () => await window.ipc.db.app.findMany(),
        queryKey: ['appDataList'],
        placeholderData: []
    });

    const { data: appList, isPlaceholderData } = useQuery({
        placeholderData: data.map(data => ({
            data,
            process: {
                icon: null,
                isRunning: false
            }
        })),
        queryKey: ['appDetails'],
        queryFn: async () => {
            const processList = await window.ipc.getAppListDetails(data.map(app => app.path));
            return await Promise.all(data.map(async (data, index) => ({
                data,
                process: processList[index]
            })));
        },
        refetchOnWindowFocus: false,
        refetchInterval: 1000,
        enabled: !basePlaceholderData
    });

    useEffect(() => {
        if (!isPlaceholderData && appList.length === 0) {
            const storage = localStorage.getItem('appDataList');
            if (!storage) return;

            try {
                const value = JSON.parse(storage) as Prisma.AppGetPayload<any>[];
                addApp(value.map(app => app.path));
            } catch { }
            localStorage.removeItem('appDataList');
        }
    }, [data, isPlaceholderData]);

    const sortedAppList = useMemo(() => {
        return appList
            .toSorted((a, b) => a.data.name.localeCompare(b.data.name));
    }, [appList]);


    return (
        <Stack height={'100vh'} >
            <Stack component={Paper} padding={2} gap={2}>
                <Stack direction="row" gap={2} alignItems={'center'}>
                    <IconButton onClick={() => setExpanded(prev => !prev)} sx={{ alignSelf: 'center' }}>
                        {expanded ? <ArrowDropUp /> : <ArrowDropDown />}
                    </IconButton>
                    <AddAppSection onAddApp={addApp} />
                    <UsbSelect onSelectedUsbConnected={handleStartAll} onSelectedUsbDisconnected={handleStopAll} />
                    <Button size='small' startIcon={<PlayArrow />} variant='outlined' color="primary" onClick={handleStartAll}>Start All</Button>
                    <Button size='small' startIcon={<Stop />} variant='outlined' color="error" onClick={handleStopAll}>Stop All</Button>
                </Stack>
                <Collapse in={!expanded}>
                    <Stack direction={'row'} gap={1} flexWrap="wrap">
                        {sortedAppList.map(app => (
                            <AppCardIcon isLoading={isPlaceholderData} processData={app.process} key={app.data.name} />
                        ))}
                    </Stack>
                </Collapse>
            </Stack>
            <Stack p={2}>
                <Collapse in={expanded} >
                    <Stack overflow={'auto'} direction={'row'} gap={2} flexWrap="wrap" alignItems={'baseline'}>
                        {sortedAppList
                            .map(app => (
                                <AppCard
                                    key={app.data.path}
                                    data={app.data}
                                    isLoading={isPlaceholderData}
                                    processData={app.process}
                                    onDeleteApp={handleDeleteApp}
                                    onUpdateAppMetaData={handleUpdateApp}
                                />
                            ))}
                    </Stack>
                </Collapse>
            </Stack>
        </Stack>
    );

    async function addApp(paths?: string[]) {
        const pathList = paths ?? await window.ipc.openFileDialog();

        for (const path of pathList) {
            if (data.find(app => app.path === path)) {
                console.warn(`App with path ${path} already exists.`);
                continue;
            }

            await window.ipc.db.app.create({
                data: {
                    name: path.split('\\').pop() || '',
                    path
                }
            });
        }

        refetch();
    };

    async function handleDeleteApp(id: string) {
        await window.ipc.db.app.delete({ where: { id } });
        refetch();
    }

    async function handleUpdateApp(id: string, data: Prisma.AppUpdateInput) {
        await window.ipc.db.app.update({
            where: { id },
            data
        });
        refetch();
    }

    async function handleStartAll() {
        await window.ipc.launchApp(data.map(data => data.path));
    }

    async function handleStopAll() {
        await window.ipc.stopApp(data.map(data => data.path));
    }
}
