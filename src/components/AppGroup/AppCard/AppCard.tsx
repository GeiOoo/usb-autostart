import { App, db } from '@/src/db/db';
import { Delete, PlayArrow, Settings, Stop } from '@mui/icons-material';
import { Button, Card, CardActions, CardHeader, Dialog, IconButton, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import AppCardSettings from './AppCardSettings';

export type AppLiveData = {
    icon: string,
    isRunning: boolean,
};

export default function AppCard({ data, processData, isLoading }: {
    data: App,
    processData: AppLiveData,
    isLoading: boolean,
}) {
    const { path } = data;

    const [ showSettingsDialog, setShowSettingsDialog ] = useState(false);

    const nameSkeletonLengthInPixel = path.split('\\').pop()!.length * 8 || 0;

    return (
        <Stack
            key={path}
            component={Card}
            flex={1}
            maxWidth={400}
            minWidth={250}
            raised={processData?.isRunning}
        >
            <CardHeader
                action={<IconButton color="error" onClick={handleDelete} size="small"><Delete /></IconButton>}
                avatar={isLoading ? <Skeleton height={32} variant="circular" width={32} /> : (
                    <img
                        alt="icon"
                        height={32}
                        src={processData.icon}
                        width={32}
                    />
                )}
                title={
                    isLoading ?
                        <Skeleton height={28} width={nameSkeletonLengthInPixel} />
                        :
                        (
                            <Tooltip placement="top" title={path} arrow>
                                <Typography color={processData.isRunning ? 'primary' : 'textPrimary'}>{data.name}</Typography>
                            </Tooltip>
                        )
                }
            />
            <CardActions sx={{ pt: 0 }}>
                <Button
                    variant="outlined"
                    fullWidth
                    {...processData?.isRunning ? {
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
