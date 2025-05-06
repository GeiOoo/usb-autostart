'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

const theme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const queryClient = new QueryClient();

export default function BaseProvider({ children }: PropsWithChildren) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </ThemeProvider>
    );
}
