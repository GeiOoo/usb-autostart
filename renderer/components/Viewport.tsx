import { Add } from '@mui/icons-material';
import { AppBar, IconButton, Stack, Toolbar } from '@mui/material';
import useLocalStorageState from '../hooks/useLocalStorageState';
import AppCard from './AppCard';

export default function Viewport() {
    const [appPathList, setAppPathList] = useLocalStorageState<string[]>([], 'appPathList');

    return (<>
        <AppBar>
            <Toolbar>
                <IconButton onClick={handleFileSelect}>
                    <Add />
                </IconButton>
            </Toolbar>
        </AppBar>
        <Stack direction={'row'} spacing={2} padding={2} marginTop={10}>
            {appPathList.map(path => <AppCard key={path} path={path} onDeleteApp={handleDeleteApp} />)}
        </Stack>
    </>
    );

    async function handleFileSelect() {
        const path = await window.ipc.openFileDialog();
        setAppPathList(prev => [...prev, path]);
    };

    function handleDeleteApp(path: string) {
        setAppPathList(prev => prev.filter(p => p !== path));
    }
}
