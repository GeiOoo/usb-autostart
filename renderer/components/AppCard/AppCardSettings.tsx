import { UploadFile } from '@mui/icons-material';
import { Button, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField } from '@mui/material';
import { FormEvent, useState } from 'react';
import { AppMetaData } from './AppCard';

export default function AppCardSettings({ data, closeDialog, updateAppMetaData }: {
    data: AppMetaData;
    closeDialog: () => void;
    updateAppMetaData: (path: string, newData: AppMetaData) => void;
}) {
    const [name, setName] = useState(data.name);
    const [path, setPath] = useState(data.path);

    return (
        <form onSubmit={handleSave}>
            <DialogTitle>App Settings - {data.name}</DialogTitle>
            <Stack component={DialogContent} gap={1}>
                <TextField
                    margin='dense'
                    label="Name"
                    fullWidth
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <Stack direction='row' gap={1} alignItems={'center'}>
                    <TextField
                        margin='dense'
                        label="Path"
                        fullWidth
                        value={path}
                        onChange={e => setName(e.target.value)}
                    />
                    <IconButton onClick={handleSelectFile}><UploadFile /></IconButton>
                </Stack>
            </Stack>
            <DialogActions>
                <Button onClick={closeDialog} >Cancel</Button>
                <Button type='submit' >Save</Button>
            </DialogActions>
        </form>
    );

    async function handleSelectFile() {
        const path = await window.ipc.openFileDialog();
        console.log({ path });

        if (path.length > 0) {
            setPath(path[0]);
            setName(path[0].split('\\').pop() || '');
        }
    }

    function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        updateAppMetaData(data.path, { name, path });
        closeDialog();
    }
}
