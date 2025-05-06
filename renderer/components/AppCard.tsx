'use client';

import { Box, Button, Card, CardActions, CardContent, CardHeader } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

export type AppData = {
    name: string;
    path: string;
    icon: Electron.NativeImage;
};

export default function AppCard({ path, onDeleteApp }: {
    path: string;
    onDeleteApp: (path: string) => void;
}) {

    const { data } = useQuery<AppData>({
        queryKey: ['appDetails', path],
        queryFn: async () => await window.ipc.getAppDetails(path),
        refetchOnWindowFocus: false,
        refetchInterval: 1000
    });

    if (!data) {
        return <Card><CardContent>Failed</CardContent></Card>;
    }

    return (
        <Card key={data.path}>
            <CardHeader avatar={<Image alt='icon' src={data.icon.toDataURL()} height={32} width={32} />} title={data.name} />
            <CardActions>
                <Button size='small' color='error' onClick={() => onDeleteApp(path)}>Delete</Button>
                <Box flex={1} />
                <Button size='small' color='primary'>Open</Button>
            </CardActions>
        </Card>
    );
}
