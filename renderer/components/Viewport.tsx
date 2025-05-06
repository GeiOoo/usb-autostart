import { Add } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import useLocalStorageState from '../hooks/useLocalStorageState';
import AppCard from './AppCard';

export default function Viewport() {
    const [appPathList, setAppPathList] = useLocalStorageState<string[]>([], 'appPathList');

    return (
        <Stack spacing={2} padding={2}>
            <Button startIcon={<Add />} sx={{ alignSelf: 'start' }} variant='outlined' onClick={handleFileSelect}>Add App</Button>
            <Stack direction={'row'} spacing={2}>
                {appPathList.map(path => <AppCard key={path} path={path} onDeleteApp={handleDeleteApp} />)}
            </Stack>
        </Stack>
    );

    async function handleFileSelect() {
        const path = await window.ipc.openFileDialog();
        setAppPathList(prev => [...prev, path]);
    };

    function handleDeleteApp(path: string) {
        setAppPathList(prev => prev.filter(p => p !== path));
    }
}
