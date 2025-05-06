import { NoSsr } from '@mui/material';
import BaseProvider from '../components/BaseProvider';
import Viewport from '../components/Viewport';

export default function HomePage() {
    return (
        <BaseProvider>
            <NoSsr>
                <Viewport />
            </NoSsr>
        </BaseProvider>
    );
}
