'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

const theme = createTheme({
    palette: {
        mode: 'dark',
    },
    components: {
        MuiSelect: {
            defaultProps: {
                size: 'small'
            }
        },
        MuiButton: {
            defaultProps: {
                size: 'small',
            }
        },
        MuiIconButton: {
            defaultProps: {
                size: 'small',
            }
        }
    }
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
