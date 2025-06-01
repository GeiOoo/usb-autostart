import { ArrowDropDown, ArrowDropUp, PlayArrow, Stop } from '@mui/icons-material';
import { Button, Collapse, IconButton, Paper, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db } from '../../db/db';
import UsbSelect from '../UsbSelect';
import AddApplications from './AddApplications/AddApplications';
import AppCard from './AppCard/AppCard';
import AppCardIcon from './AppCard/AppCardIcon';

export default function AppGroup() {
    const [ expanded, setExpanded ] = useState(false);
    const appDataList = useLiveQuery(() => db.app.toArray(), [], []);

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
                    <AddApplications />
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
                                    processData={app.process}
                                />
                            ))}
                    </Stack>
                </Collapse>
            </Stack>
        </Stack>
    );

    async function handleStartAll() {
        await window.ipc.launchApp(appDataList.map(data => data.path));
    }

    async function handleStopAll() {
        await window.ipc.stopApp(appDataList.map(data => data.path));
    }
}
