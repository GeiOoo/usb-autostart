'use client';

import { Delete, PlayArrow, Settings, Stop } from '@mui/icons-material';
import { Button, Card, CardActions, CardHeader, Dialog, IconButton, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import AppCardSettings from './AppCardSettings';

export type AppLiveData = {
    icon: string,
    isRunning: boolean,
};

export type AppMetaData = {
    name: string,
    path: string,
};

export default function AppCard({ data, onDeleteApp, onUpdateAppMetaData, processData, isLoading }: {
    data: AppMetaData,
    processData: AppLiveData,
    isLoading: boolean,
    onDeleteApp: (path: string) => void,
    onUpdateAppMetaData: (oldPath: string, newData: AppMetaData) => void,
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
                        updateAppMetaData={onUpdateAppMetaData}
                    />
                </Dialog>
            </CardActions>
        </Stack>
    );

    function handleDelete() {
        onDeleteApp(path);
    }
}
