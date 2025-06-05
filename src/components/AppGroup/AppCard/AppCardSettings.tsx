import { App, db } from '@/src/db/db';
import { UploadFile } from '@mui/icons-material';
import { Button, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField } from '@mui/material';
import { FormEvent, useState } from 'react';

export default function AppCardSettings({ data, closeDialog }: {
    data: App,
    closeDialog: () => void,
}) {
    const [ name, setName ] = useState(data.name);
    const [ path, setPath ] = useState(data.path);

    return (
        <form onSubmit={handleSave}>
            <DialogTitle>App Settings - {data.name}</DialogTitle>
            <Stack component={DialogContent} gap={1}>
                <TextField
                    label="Name"
                    margin="dense"
                    onChange={e => setName(e.target.value)}
                    value={name}
                    fullWidth
                />
                <Stack alignItems={'center'} direction="row" gap={1}>
                    <TextField
                        label="Path"
                        margin="dense"
                        onChange={e => setName(e.target.value)}
                        value={path}
                        fullWidth
                    />
                    <IconButton onClick={handleSelectFile}><UploadFile /></IconButton>
                </Stack>
            </Stack>
            <DialogActions>
                <Button onClick={closeDialog}>Cancel</Button>
                <Button type="submit">Save</Button>
            </DialogActions>
        </form>
    );

    async function handleSelectFile() {
        const path = await window.ipc.callAction('openFileDialog');
        console.log({ path });

        if (path.length > 0) {
            setPath(path[0]);
            setName(path[0].split('\\').pop() || '');
        }
    }

    async function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await db.app.update(data.id, { name, path });
        closeDialog();
    }
}
