'use client';

import { Delete, Edit, Pause, PlayArrow } from '@mui/icons-material';
import { Box, Button, Card, CardActions, CardContent, CardHeader, IconButton, Skeleton, Stack, Typography } from '@mui/material';
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
    const { data, isLoading } = useQuery<AppData>({
        queryKey: ['appDetails', path],
        queryFn: async () => await window.ipc.getAppDetails(path),
        refetchOnWindowFocus: false,
        refetchInterval: 500,
    });

    if (isLoading) {
        return <Stack component={Card} p={1}>
            <Stack direction='row' gap={2}>
                <Skeleton variant='circular' width={40} height={40} />
                <Skeleton width={150} height={40} />
            </Stack>
            <Skeleton height={40} />
        </Stack>;
    }

    if (!data) {
        return <Card><CardContent>Failed</CardContent></Card>;
    }

    return (
        <Card key={data.path} raised={data.isRunning}>
            <CardHeader
                action={<IconButton sx={{ ml: 1 }}><Edit /></IconButton>}
                avatar={<Image alt='icon' src={data.icon.toDataURL()} height={32} width={32} />}
                title={<Typography color={data.isRunning ? 'primary' : 'textPrimary'}>{data.name}</Typography>}
            />
            <CardActions>
                <Button size='small' color='error' startIcon={<Delete />} onClick={handleDelete} >
                    Delete
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                {data.isRunning ?
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
