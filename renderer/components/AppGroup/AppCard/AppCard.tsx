'use client';

import { Delete, PlayArrow, Settings, Stop } from '@mui/icons-material';
import { Button, Card, CardActions, CardHeader, Dialog, IconButton, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { Prisma } from '@prisma/client';
import Image from 'next/image';
import { useState } from 'react';
import AppCardSettings from './AppCardSettings';

export type AppLiveData = {
    icon: string;
    isRunning: boolean;
};

export default function AppCard({ data, onDeleteApp, onUpdateAppMetaData, processData, isLoading }: {
    data: Prisma.AppGetPayload<any>;
    processData: AppLiveData;
    isLoading: boolean;
    onDeleteApp: (id: string) => void;
    onUpdateAppMetaData: (id: string, newData: typeof data) => void;
}) {
    const { id, path } = data;

    const [showSettingsDialog, setShowSettingsDialog] = useState(false);

    const nameSkeletonLengthInPixel = path.split('\\').pop()?.length * 8 || 0;

    return (
        <Stack component={Card} key={id} raised={processData?.isRunning} flex={1} minWidth={250} maxWidth={400}>
            <CardHeader
                action={<IconButton size='small' color='error' onClick={handleDelete} ><Delete /></IconButton>}
                avatar={isLoading ? <Skeleton variant='circular' width={32} height={32} /> : <Image alt='icon' src={processData.icon} height={32} width={32} />}
                title={isLoading ?
                    <Skeleton width={nameSkeletonLengthInPixel} height={28} />
                    :
                    <Tooltip title={path} placement='top' arrow>
                        <Typography color={processData.isRunning ? 'primary' : 'textPrimary'}>{data.name}</Typography>
                    </Tooltip>
                }
            />
            <CardActions sx={{ pt: 0 }}>
                <Button
                    variant='outlined'
                    fullWidth
                    {...processData?.isRunning ? {
                        children: 'Stop',
                        startIcon: <Stop />,
                        onClick: () => window.ipc.stopApp([path])
                    } : {
                        children: 'Start',
                        startIcon: <PlayArrow />,
                        onClick: () => window.ipc.launchApp([path])
                    }}
                />
                <IconButton onClick={() => setShowSettingsDialog(true)}><Settings /></IconButton>
                <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} fullWidth>
                    <AppCardSettings
                        data={data}
                        closeDialog={() => setShowSettingsDialog(false)}
                        updateAppMetaData={onUpdateAppMetaData}
                    />
                </Dialog>
            </CardActions>
        </Stack >
    );

    function handleDelete() {
        onDeleteApp(id);
    }
}
