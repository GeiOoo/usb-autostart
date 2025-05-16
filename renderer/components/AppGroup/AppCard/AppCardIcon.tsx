import { Card, Skeleton, Stack, useTheme } from '@mui/material';
import Image from 'next/image';
import { AppLiveData } from './AppCard';

export default function AppCardIcon({ processData, isLoading }: {
    isLoading: boolean;
    processData: AppLiveData;
}) {
    const theme = useTheme();

    return (
        <Stack component={Card} p={1} variant='outlined' borderColor={processData.isRunning ? `${theme.palette.success.main}99` : undefined} >
            {isLoading ? <Skeleton variant='circular' width={16} height={16} /> : <Image alt='icon' src={processData.icon} height={16} width={16} />}
        </Stack>
    );
}
