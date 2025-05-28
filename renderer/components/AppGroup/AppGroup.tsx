import { Add, ArrowDropDown, ArrowDropUp, PlayArrow, Search, Stop } from '@mui/icons-material';
import { Autocomplete, Button, ButtonGroup, Collapse, IconButton, Paper, Stack, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import UsbSelect from '../UsbSelect';
import AppCard from './AppCard/AppCard';
import AppCardIcon from './AppCard/AppCardIcon';

interface Process {
    name: string;
    path: string;
}

export default function AppGroup() {
    const [expanded, setExpanded] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleShowSearch = () => {
        setShowSearch(true);
        // Focus will be handled by autoFocus prop
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 200);

        return () => clearTimeout(timer);
    }, [searchText]);

    // Add query for running processes
    const { data: runningProcesses = [], isFetching } = useQuery({
        queryKey: ['runningProcesses', debouncedSearch],
        queryFn: async () => debouncedSearch ? await window.ipc.getRunningProcesses(debouncedSearch) : [],
        enabled: debouncedSearch.length > 0
    });

    const { data, refetch } = useQuery({
        queryFn: async () => await window.ipc.db.app.findMany(),
        queryKey: ['appDataList'],
        placeholderData: []
    });

    const { data: appList, isPlaceholderData } = useQuery({
        placeholderData: data.map(data => ({
            data,
            process: {
                icon: null,
                isRunning: false
            }
        })),
        queryKey: ['appDetails'],
        queryFn: async () => {
            const processList = await window.ipc.getAppListDetails(data.map(app => app.path));
            return await Promise.all(data.map(async (data, index) => ({
                data,
                process: processList[index]
            })));
        },
        refetchOnWindowFocus: false,
        refetchInterval: 1000,
    });

    const sortedAppList = useMemo(() => {
        return appList
            .toSorted((a, b) => a.data.name.localeCompare(b.data.name));
    }, [appList]);


    return (
        <Stack height={'100vh'} >
            <Stack component={Paper} padding={2} gap={2}>
                <Stack direction="row" gap={2} alignItems={'center'}>
                    <IconButton onClick={() => setExpanded(prev => !prev)} sx={{ alignSelf: 'center' }}>
                        {expanded ? <ArrowDropUp /> : <ArrowDropDown />}
                    </IconButton>
                    {showSearch ? (
                        <Autocomplete
                            size="small"
                            sx={{ minWidth: 300 }}
                            open={true}
                            options={runningProcesses}
                            loading={isFetching}
                            value={null}
                            getOptionLabel={(option: Process) => option.name}
                            onInputChange={(_event, value) => setSearchText(value)}
                            onChange={(_event, process) => {
                                if (process) {
                                    addApp([process.path]);
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
                        />
                    ) : (
                        <ButtonGroup>
                            <Button size='small' startIcon={<Add />} variant='outlined' onClick={() => addApp()}>Add App</Button>
                            <Button size='small' startIcon={<Search />} variant='outlined' onClick={handleShowSearch}>processes</Button>
                        </ButtonGroup>
                    )}
                    <UsbSelect onSelectedUsbConnected={handleStartAll} onSelectedUsbDisconnected={handleStopAll} />
                    <Button size='small' startIcon={<PlayArrow />} variant='outlined' color="primary" onClick={handleStartAll}>Start All</Button>
                    <Button size='small' startIcon={<Stop />} variant='outlined' color="error" onClick={handleStopAll}>Stop All</Button>
                </Stack>
                <Collapse in={!expanded}>
                    <Stack direction={'row'} gap={1} flexWrap="wrap">
                        {sortedAppList.map(app => (
                            <AppCardIcon isLoading={isPlaceholderData} processData={app.process} key={app.data.name} />
                        ))}
                    </Stack>
                </Collapse>
            </Stack>
            <Stack p={2}>
                <Collapse in={expanded} >
                    <Stack overflow={'auto'} direction={'row'} gap={2} flexWrap="wrap" alignItems={'baseline'}>
                        {sortedAppList
                            .map(app => (
                                <AppCard
                                    key={app.data.path}
                                    data={app.data}
                                    isLoading={isPlaceholderData}
                                    processData={app.process}
                                    onDeleteApp={handleDeleteApp}
                                    onUpdateAppMetaData={handleUpdateApp}
                                />
                            ))}
                    </Stack>
                </Collapse>
            </Stack>
        </Stack>
    );

    async function addApp(paths?: string[]) {
        const pathList = paths ?? await window.ipc.openFileDialog();

        for (const path of pathList) {
            await window.ipc.db.app.create({
                data: {
                    name: path.split('\\').pop() || '',
                    path
                }
            });
        }

        refetch();
    };

    async function handleDeleteApp(path: string) {
        await window.ipc.db.app.delete({ where: { path } });
        refetch();
    }

    async function handleUpdateApp(path: string, newData: { name?: string; path?: string; }) {
        await window.ipc.db.app.update({
            where: { path },
            data: newData
        });
        refetch();
    }

    async function handleStartAll() {
        await window.ipc.launchApp(data.map(data => data.path));
    }

    async function handleStopAll() {
        await window.ipc.stopApp(data.map(data => data.path));
    }
}
