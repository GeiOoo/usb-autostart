'use client';

import { Delete, Edit, Pause, PlayArrow } from '@mui/icons-material';
import { Box, Button, Card, CardActions, CardContent, CardHeader, IconButton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';

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
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const { data } = useQuery<AppData>({
        queryKey: ['appDetails', path],
        queryFn: async () => await window.ipc.getAppDetails(path),
        refetchOnWindowFocus: false,
        refetchInterval: 500,
    });

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
                <Button size='small' color='error' startIcon={<Delete />} onClick={handleDelete} disabled={data.isRunning}>
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
