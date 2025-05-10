import { NoSsr } from '@mui/material';
import BaseProvider from '../components/BaseProvider';
import AppGroup from '../components/Viewport';

export default function HomePage() {
    return (
        <BaseProvider>
            <NoSsr>
                <AppGroup />
            </NoSsr>
        </BaseProvider>
    );
}
