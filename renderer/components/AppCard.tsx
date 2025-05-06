'use client';

import { Delete, PlayArrow, Settings, Stop } from '@mui/icons-material';
import { Button, Card, CardActions, CardHeader, IconButton, Skeleton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

export type AppData = {
    name: string;
    path: string;
    icon: Electron.NativeImage;
    isRunning: boolean;
};

export default function AppCard({ path, onDeleteApp }: {
    path: string;
    onDeleteApp: (path: string) => void;
}) {
    const { data, isLoading } = useQuery({
        queryKey: ['appDetails', path],
        queryFn: async () => await window.ipc.getAppDetails(path),
        refetchOnWindowFocus: false,
        refetchInterval: 500,
    });

    const nameSkeletonLengthInPixel = path.split('\\').pop()?.length * 8 || 0;
    const pathSskeletonLengthInPixel = path.length * 7 || 0;

    return (
        <Card key={path} raised={data?.isRunning}>
            <CardHeader
                action={<IconButton size='small' color='error' onClick={handleDelete} ><Delete /></IconButton>}
                avatar={isLoading ? <Skeleton variant='circular' width={32} height={32} /> : <Image alt='icon' src={data.icon.toDataURL()} height={32} width={32} />}
                title={isLoading ? <Skeleton width={nameSkeletonLengthInPixel} height={28} /> : <Typography color={data.isRunning ? 'primary' : 'textPrimary'}>{data.name}</Typography>}
                subheader={isLoading ? <Skeleton width={pathSskeletonLengthInPixel} height={20} /> : <Typography fontFamily={'monospace'} color='textSecondary' variant='caption'>{path}</Typography>}
            />
            <CardActions sx={{ pt: 0 }}>
                <Button
                    size='small'
                    color='primary'
                    variant='outlined'
                    fullWidth
                    {...data?.isRunning ? {
                        children: 'Stop',
                        startIcon: <Stop />,
                        onClick: () => window.ipc.stopApp(path)
                    } : {
                        children: 'Start',
                        startIcon: <PlayArrow />,
                        onClick: () => window.ipc.launchApp(path)
                    }}
                />
                <IconButton><Settings /></IconButton>
            </CardActions>
        </Card >
    );

    function handleDelete() {
        onDeleteApp(path);
    }
}
