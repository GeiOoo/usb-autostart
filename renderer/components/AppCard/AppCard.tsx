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
        refetchInterval: 500,
        select: data => {
            return {
                ...data,
                icon: data.icon.toDataURL()
            };
        }
    });

    const [showSettingsDialog, setShowSettingsDialog] = useState(false);

    const nameSkeletonLengthInPixel = path.split('\\').pop()?.length * 8 || 0;
    const pathSskeletonLengthInPixel = Math.min(path.length * 7, 240);

    return (
        <Stack component={Card} key={path} raised={processData?.isRunning}>
            <CardHeader
                action={<IconButton size='small' color='error' onClick={handleDelete} ><Delete /></IconButton>}
                avatar={isLoading ? <Skeleton variant='circular' width={32} height={32} /> : <Image alt='icon' src={processData.icon} height={32} width={32} />}
                title={isLoading ? <Skeleton width={nameSkeletonLengthInPixel} height={28} /> : <Typography color={processData.isRunning ? 'primary' : 'textPrimary'}>{data.name}</Typography>}
                subheader={isLoading ?
                    <Skeleton width={pathSskeletonLengthInPixel} height={20} />
                    :
                    <Tooltip title={path} placement='top' arrow>
                        <Typography
                            display={'block'}
                            width={250}
                            textOverflow={'ellipsis'}
                            overflow={'hidden'}
                            whiteSpace={'nowrap'}
                            fontFamily={'monospace'}
                            color='textSecondary'
                            variant='caption'
                        >
                            {path}
                        </Typography>
                    </Tooltip>
                }
            />
            <CardActions sx={{ pt: 0 }}>
                <Button
                    size='small'
                    color='primary'
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
