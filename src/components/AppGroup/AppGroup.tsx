import useLocalStorageState from '@/src/hooks/useLocalStorageState';
import { ArrowDropDown, ArrowDropUp, PlayArrow, Stop } from '@mui/icons-material';
import { Button, IconButton, Paper, Stack } from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '../../db/db';
import UsbSelect from '../UsbSelect';
import AddApplications from './AddApplications/AddApplications';
import AppCard from './AppCard/AppCard';

export default function AppGroup() {
    const [ expanded, setExpanded ] = useLocalStorageState(false, 'appGroupExpanded');
    const appList = useLiveQuery(() => db.app.toArray(), [], []);

    const sortedAppList = useMemo(() => {
        return appList?.sort((a, b) => a.name.localeCompare(b.name)) ?? [];
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
            </Stack>
            <Stack
                alignItems={'baseline'}
                direction={'row'}
                flexWrap="wrap"
                gap={2}
                overflow={'auto'}
                p={2}
            >
                {sortedAppList
                    .map(app => (
                        <AppCard key={app.path} data={app} extendedView={expanded} />
                    ))}
            </Stack>
        </Stack>
    );

    async function handleStartAll() {
        window.ipc.setUsbActive();
        await window.ipc.launchApp(appList.map(data => data.path));
    }

    async function handleStopAll() {
        window.ipc.setUsbInactive();
        await window.ipc.stopApp(appList.map(data => data.path));
    }
}
