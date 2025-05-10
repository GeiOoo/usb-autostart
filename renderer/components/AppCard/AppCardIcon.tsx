import { Card, Skeleton, Stack, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

export default function AppCardIcon({ path }: { path: string; }) {
    const theme = useTheme();
    const { data: processData, isLoading } = useQuery({
        queryKey: ['appDetails', path],
        queryFn: async () => await window.ipc.getAppDetails(path),
        refetchOnWindowFocus: false,
        refetchInterval: 1000,
        select: data => {
            return {
                ...data,
                icon: data.icon.toDataURL()
            };
        }
    });

    return (
        <Stack component={Card} p={1} variant='outlined' borderColor={processData?.isRunning ? `${theme.palette.success.main}99` : undefined} >
            {isLoading ? <Skeleton variant='circular' width={16} height={16} /> : <Image alt='icon' src={processData.icon} height={16} width={16} />}
        </Stack>
    );
}
