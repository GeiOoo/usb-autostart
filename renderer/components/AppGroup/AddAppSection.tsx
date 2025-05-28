import { Add, Search } from '@mui/icons-material';
import { Autocomplete, Button, ButtonGroup, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

export default function AddAppSection({ onAddApp }: {
    onAddApp: (paths?: string[]) => Promise<void>;
}) {
    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 200);

        return () => clearTimeout(timer);
    }, [searchText]);

    const { data, isFetching } = useQuery({
        placeholderData: [],
        queryKey: ['runningProcesses', debouncedSearch],
        queryFn: async () => debouncedSearch ? await window.ipc.getRunningProcesses(debouncedSearch) : [],
        enabled: debouncedSearch.length > 0
    });

    if (!showSearch) {
        return <ButtonGroup>
            <Button size='small' startIcon={<Add />} variant='outlined' onClick={() => onAddApp()}>Add App</Button >
            <Button size='small' startIcon={<Search />} variant='outlined' onClick={() => setShowSearch(true)}>processes</Button>
        </ButtonGroup >;
    }

    return <Autocomplete
        size="small"
        sx={{ minWidth: 300 }}
        open={true}
        options={data}
        loading={isFetching}
        value={null}
        getOptionLabel={option => option.name}
        onInputChange={(_event, value) => setSearchText(value)}
        onChange={(_event, process) => {
            if (process) {
                onAddApp([process.path]);
                setSearchText('');
                setShowSearch(false);
            }
        }}
        onBlur={() => {
            setShowSearch(false);
            setSearchText('');
        }}
        renderInput={(params) => (
            <TextField
                {...params}
                inputRef={searchInputRef}
                autoFocus
                label="Search running processes"
                placeholder="Type to search..."
            />
        )}
    />;
}
