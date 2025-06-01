import { Add, Search } from '@mui/icons-material';
import { Autocomplete, Button, ButtonGroup, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

interface AddApplicationsProps {
    onAddApps: (paths?: string[]) => void,
}

export default function AddApplications({ onAddApps }: AddApplicationsProps) {
    const [ showSearch, setShowSearch ] = useState(false);
    const [ searchText, setSearchText ] = useState('');
    const [ debouncedSearch, setDebouncedSearch ] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleShowSearch = () => {
        setShowSearch(true);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 200);

        return () => clearTimeout(timer);
    }, [ searchText ]);

    const { data: runningProcesses = [], isFetching } = useQuery({
        queryKey: [ 'runningProcesses', debouncedSearch ],
        queryFn: async () => debouncedSearch ? await window.ipc.getRunningProcesses(debouncedSearch) : [],
        enabled: debouncedSearch.length > 0,
    });

    return showSearch ? (
        <Autocomplete
            getOptionLabel={option => option.name}
            loading={isFetching}
            onInputChange={(_event, value) => setSearchText(value)}
            open={true}
            options={runningProcesses}
            size="small"
            sx={{ minWidth: 300 }}
            value={null}
            onBlur={() => {
                setShowSearch(false);
                setSearchText('');
            }}
            onChange={(_event, process) => {
                if (process) {
                    onAddApps([ process.path ]);
                    setSearchText('');
                    setShowSearch(false);
                }
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    inputRef={searchInputRef}
                    label="Search running processes"
                    placeholder="Type to search..."
                    autoFocus
                />
            )}
        />
    ) : (
        <ButtonGroup>
            <Button
                onClick={() => onAddApps()}
                size="small"
                startIcon={<Add />}
                variant="outlined"
            >Add App
            </Button>
            <Button
                onClick={handleShowSearch}
                size="small"
                startIcon={<Search />}
                variant="outlined"
            >processes
            </Button>
        </ButtonGroup>
    );
}
