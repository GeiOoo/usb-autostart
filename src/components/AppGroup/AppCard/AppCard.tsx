import { App, db } from '@/src/db/db';
import { Delete, PlayArrow, Settings, Stop } from '@mui/icons-material';
import { Button, Card, CardActions, CardHeader, Dialog, IconButton, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import AppCardIcon from './AppCardIcon';
import AppCardSettings from './AppCardSettings';

export default function AppCard({ data, extendedView }: {
    data: App,
    extendedView: boolean,
}) {
    const { path } = data;
    const [ showSettingsDialog, setShowSettingsDialog ] = useState(false);
    const nameSkeletonLengthInPixel = path.split('\\').pop()!.length * 8 || 0;

    const { data: icon } = useQuery({
        queryKey: [ 'appIcon', path ],
        queryFn: async () => await window.ipc.getAppIcon(path),
        refetchOnWindowFocus: false,
    });

    const { data: isRunning = false } = useQuery({
        queryKey: [ 'appRunning', path ],
        queryFn: async () => await window.ipc.isAppRunning(path),
        refetchOnWindowFocus: false,
        // Check running state more frequently
        refetchInterval: 1000,
    });

    if (!extendedView) {
        return <AppCardIcon icon={icon} isRunning={isRunning} />;
    }

    return (
        <Stack
            key={path}
            component={Card}
            flex={1}
            maxWidth={400}
            minWidth={250}
            raised={isRunning}
        >
            <CardHeader
                action={<IconButton color="error" onClick={handleDelete} size="small"><Delete /></IconButton>}
                avatar={
                    !icon ? <Skeleton height={32} variant="circular" width={32} /> : (
                        <img
                            alt="icon"
                            height={32}
                            src={icon}
                            width={32}
                        />
                    )
                }
                title={
                    !icon ? <Skeleton height={28} width={nameSkeletonLengthInPixel} /> : (
                        <Tooltip placement="top" title={path} arrow>
                            <Typography color={isRunning ? 'primary' : 'textPrimary'}>{data.name}</Typography>
                        </Tooltip>
                    )
                }
            />
            <CardActions sx={{ pt: 0 }}>
                <Button
                    variant="outlined"
                    fullWidth
                    {...isRunning ? {
                        children: 'Stop',
                        startIcon: <Stop />,
                        onClick: () => window.ipc.stopApp([ path ]),
                    } : {
                        children: 'Start',
                        startIcon: <PlayArrow />,
                        onClick: () => window.ipc.launchApp([ path ]),
                    }}
                />
                <IconButton onClick={() => setShowSettingsDialog(true)}><Settings /></IconButton>
                <Dialog onClose={() => setShowSettingsDialog(false)} open={showSettingsDialog} fullWidth>
                    <AppCardSettings
                        closeDialog={() => setShowSettingsDialog(false)}
                        data={data}
                    />
                </Dialog>
            </CardActions>
        </Stack>
    );

    async function handleDelete() {
        await db.app.delete(data.id);
    }
}
