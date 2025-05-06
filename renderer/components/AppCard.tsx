'use client';

import { Delete, MoreVert } from '@mui/icons-material';
import { Card, CardContent, CardHeader, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';

export type AppData = {
    name: string;
    path: string;
    icon: Electron.NativeImage;
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
        refetchInterval: 1000
    });

    if (!data) {
        return <Card><CardContent>Failed</CardContent></Card>;
    }

    return (
        <Card key={data.path}>
            <CardHeader
                action={
                    <IconButton
                        sx={{ ml: 1 }}
                        onClick={handleClick}
                    >
                        <MoreVert />

                    </IconButton>
                }
                avatar={<Image alt='icon' src={data.icon.toDataURL()} height={32} width={32} />}
                title={data.name}
            />
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon><Delete color='error' /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Card>
    );

    function handleClick(event: React.MouseEvent<HTMLElement>) {
        setAnchorEl(event.currentTarget);
    }

    function handleClose() {
        setAnchorEl(null);
    }

    function handleDelete() {
        onDeleteApp(path);
        handleClose();
    }
}
