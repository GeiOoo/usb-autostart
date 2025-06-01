import { Add, ArrowDropDown, ArrowDropUp, PlayArrow, Search, Stop } from '@mui/icons-material';
import { Autocomplete, Button, ButtonGroup, Collapse, IconButton, Paper, Stack, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import useLocalStorageState from '../../hooks/useLocalStorageState';
import UsbSelect from '../UsbSelect';
import AppCard, { AppMetaData } from './AppCard/AppCard';
import AppCardIcon from './AppCard/AppCardIcon';

interface Process {
    name: string,
    path: string,
}

export default function AppGroup() {
    const [ expanded, setExpanded ] = useState(false);
    const [ showSearch, setShowSearch ] = useState(false);
    const [ appDataList, setAppDataList ] = useLocalStorageState<AppMetaData[]>([], 'appDataList');
    const [ searchText, setSearchText ] = useState('');
    const [ debouncedSearch, setDebouncedSearch ] = useState('');
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
    }, [ searchText ]);

    // Add query for running processes
    const { data: runningProcesses = [], isFetching } = useQuery({
        queryKey: [ 'runningProcesses', debouncedSearch ],
        queryFn: async () => debouncedSearch ? await window.ipc.getRunningProcesses(debouncedSearch) : [],
        enabled: debouncedSearch.length > 0,
    });

    const { data: appList, isPlaceholderData } = useQuery({
        placeholderData: appDataList.map(data => ({
            data,
            process: {
                icon: '',
                isRunning: false,
            },
        })),
        queryKey: [ 'appDetails' ],
        queryFn: async () => {
            const processList = await window.ipc.getAppListDetails(appDataList.map(app => app.path));
            return appDataList.map((data, index) => ({
                data,
                process: processList[index],
            }));
        },
        refetchOnWindowFocus: false,
        refetchInterval: 1000,
    });

    const sortedAppList = useMemo(() => {
        return appList?.sort((a, b) => a.data.name.localeCompare(b.data.name)) ?? [];
    }, [ appList ]);

    return (
        <Stack height={'100vh'}>
            <Stack component={Paper} gap={2} padding={2}>
                <Stack alignItems={'center'} direction="row" gap={2}>
                    <IconButton onClick={() => setExpanded(prev => !prev)} sx={{ alignSelf: 'center' }}>
                        {expanded ? <ArrowDropUp /> : <ArrowDropDown />}
                    </IconButton>
                    {showSearch ? (
                        <Autocomplete
                            getOptionLabel={(option: Process) => option.name}
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
                                    handleAddApp(process.path);
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
                                onClick={handleFileSelect}
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
                    )}
                    <UsbSelect onSelectedUsbConnected={handleStartAll} onSelectedUsbDisconnected={handleStopAll} />
                    <Button
                        color="primary"
                        onClick={handleStartAll}
                        size="small"
                        startIcon={<PlayArrow />}
                        variant="outlined"
                    >Start All
                    </Button>
                    <Button
                        color="error"
                        onClick={handleStopAll}
                        size="small"
                        startIcon={<Stop />}
                        variant="outlined"
                    >Stop All
                    </Button>
                </Stack>
                <Collapse in={!expanded}>
                    <Stack direction={'row'} flexWrap="wrap" gap={1}>
                        {sortedAppList.map(app => (
                            <AppCardIcon key={app.data.name} isLoading={isPlaceholderData} processData={app.process} />
                        ))}
                    </Stack>
                </Collapse>
            </Stack>
            <Stack p={2}>
                <Collapse in={expanded}>
                    <Stack
                        alignItems={'baseline'}
                        direction={'row'}
                        flexWrap="wrap"
                        gap={2}
                        overflow={'auto'}
                    >
                        {sortedAppList
                            .map(app => (
                                <AppCard
                                    key={app.data.path}
                                    data={app.data}
                                    isLoading={isPlaceholderData}
                                    onDeleteApp={handleDeleteApp}
                                    processData={app.process}
                                    onUpdateAppMetaData={(oldPath, newData) => {
                                        setAppDataList(prev => prev.map(app => app.path === oldPath ? newData : app));
                                    }}
                                />
                            ))}
                    </Stack>
                </Collapse>
            </Stack>
        </Stack>
    );

    async function handleFileSelect() {
        const paths = await window.ipc.openFileDialog();
        setAppDataList(prev => {
            const newPaths = paths.filter(p => !prev.some(app => app.path === p));
            return [ ...prev, ...newPaths.map(path => ({
                name: path.split('\\').pop() || '',
                path,
            })) ];
        });
    }

    function handleDeleteApp(path: string) {
        setAppDataList(prev => prev.filter(app => app.path !== path));
    }

    async function handleStartAll() {
        await window.ipc.launchApp(appDataList.map(data => data.path));
    }

    async function handleStopAll() {
        await window.ipc.stopApp(appDataList.map(data => data.path));
    }

    function handleAddApp(path: string) {
        setAppDataList(prev => {
            if (prev.some(app => app.path === path)) {
                return prev;
            }
            return [ ...prev, {
                name: path.split('\\').pop() || '',
                path,
            } ];
        });
    }
}
