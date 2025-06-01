import { Card, Skeleton, Stack, useTheme } from '@mui/material';

export default function AppCardIcon({ icon, isRunning }: {
    icon?: string,
    isRunning?: boolean,
}) {
    const theme = useTheme();

    return (
        <Stack
            borderColor={isRunning ? `${theme.palette.success.main}99` : undefined}
            component={Card}
            p={1}
            variant="outlined"
        >
            {!icon ? <Skeleton height={16} variant="circular" width={16} /> : (
                <img
                    alt="icon"
                    height={16}
                    src={icon}
                    width={16}
                />
            )}
        </Stack>
    );
}
