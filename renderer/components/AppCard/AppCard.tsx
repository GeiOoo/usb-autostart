'use client';

import { Delete, PlayArrow, Settings, Stop } from '@mui/icons-material';
import { Button, Card, CardActions, CardHeader, Dialog, IconButton, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import AppCardSettings from './AppCardSettings';

export type AppMetaData = {
    name: string;
    path: string;
};

export type AppLiveData = {
    icon: Electron.NativeImage;
    isRunning: boolean;
};

export default function AppCard({ data, onDeleteApp, onUpdateAppMetaData }: {
    data: AppMetaData;
    onDeleteApp: (path: string) => void;
    onUpdateAppMetaData: (oldPath: string, newData: AppMetaData) => void;
}) {
    const { path } = data;

    const { data: processData, isLoading } = useQuery({
        queryKey: ['appDetails', path],
        queryFn: async () => await window.ipc.getAppDetails(path),
        refetchOnWindowFocus: false,
        refetchInterval: 1000,
        select: data => {
            return {
                ...data,
                icon: data.icon.toDataURL()
            };
        }
    });

    const [showSettingsDialog, setShowSettingsDialog] = useState(false);

    const nameSkeletonLengthInPixel = path.split('\\').pop()?.length * 8 || 0;

    return (
        <Stack component={Card} key={path} raised={processData?.isRunning} flex={1} minWidth={250} maxWidth={400}>
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
                        onClick: () => window.ipc.stopApp(path)
                    } : {
                        children: 'Start',
                        startIcon: <PlayArrow />,
                        onClick: () => window.ipc.launchApp(path)
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
        onDeleteApp(path);
    }
}
