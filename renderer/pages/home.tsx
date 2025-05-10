import { NoSsr } from '@mui/material';
import AppGroup from '../components/AppGroup/AppGroup';
import BaseProvider from '../components/BaseProvider';

export default function HomePage() {
    return (
        <BaseProvider>
            <NoSsr>
                <AppGroup />
            </NoSsr>
        </BaseProvider>
    );
}
