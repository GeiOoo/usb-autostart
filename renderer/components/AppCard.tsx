'use client';

import { Delete, Edit, Pause, PlayArrow } from '@mui/icons-material';
import { Box, Button, Card, CardActions, CardHeader, IconButton, Skeleton, Typography } from '@mui/material';
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

    const skeletonLengthInPixel = path.split('\\').pop()?.length * 8 || 0;

    return (
        <Card key={path} raised={data?.isRunning}>
            <CardHeader
                action={!isLoading && <IconButton sx={{ ml: 1 }}><Edit /></IconButton>}
                avatar={isLoading ? <Skeleton variant='circular' width={32} height={32} /> : <Image alt='icon' src={data.icon.toDataURL()} height={32} width={32} />}
                title={isLoading ? <Skeleton width={skeletonLengthInPixel} height={32} /> : <Typography color={data.isRunning ? 'primary' : 'textPrimary'}>{data.name}</Typography>}
            />
            <CardActions>
                <Button size='small' color='error' startIcon={<Delete />} onClick={handleDelete} >
                    Delete
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                {data?.isRunning ?
                    <Button
                        size='small'
                        color='primary'
                        startIcon={<Pause />}
                        onClick={() => window.ipc.stopApp(path)}
                    >
                        Stop
                    </Button>
                    :
                    <Button
                        size='small'
                        color='primary'
                        startIcon={<PlayArrow />}
                        onClick={() => window.ipc.launchApp(path)}
                    >
                        Launch
                    </Button>
                }
            </CardActions>
        </Card>
    );

    function handleDelete() {
        onDeleteApp(path);
    }
}
