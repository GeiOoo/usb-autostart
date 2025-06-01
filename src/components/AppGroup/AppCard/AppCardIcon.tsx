import { Card, Skeleton, Stack, useTheme } from '@mui/material';
import { AppLiveData } from './AppCard';

export default function AppCardIcon({ processData }: {
    processData?: AppLiveData,
}) {
    const theme = useTheme();

    return (
        <Stack
            borderColor={processData?.isRunning ? `${theme.palette.success.main}99` : undefined}
            component={Card}
            p={1}
            variant="outlined"
        >
            {!processData ? <Skeleton height={16} variant="circular" width={16} /> : (
                <img
                    alt="icon"
                    height={16}
                    src={processData.icon}
                    width={16}
                />
            )}
        </Stack>
    );
}
