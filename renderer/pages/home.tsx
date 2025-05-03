import { UploadFile } from '@mui/icons-material';
import { AppBar, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';
import BaseProvider from '../components/BaseProvider';

export default function HomePage() {

    const [icon, setIcon] = useState<Electron.NativeImage[]>([]);

    return (
        <BaseProvider>
            <AppBar>
                <Toolbar>
                    <IconButton onClick={handleFileSelect}>
                        <UploadFile />
                    </IconButton>
                    <Typography flex={1} textAlign={'center'}>Test</Typography>
                </Toolbar>
            </AppBar>
            <Stack direction={'row'} spacing={2} padding={2} marginTop={10}>
                {icon.map((item, index) => (
                    <img
                        key={index}
                        src={item.toDataURL()}
                        alt="icon"
                        style={{ width: 100, height: 100 }}
                    />
                ))}
            </Stack>
        </BaseProvider>
    );

    async function handleFileSelect() {
        const icon = await window.ipc.openFileDialog();
        setIcon(prev => [...prev, icon]);
    };
}
