import { Autocomplete, Stack, TextField } from '@mui/material';
import { USBDevice as ElectronUSBDevice } from 'electron/renderer';
import { useEffect, useState } from 'react';
import useLocalStorageState from '../hooks/useLocalStorageState';

const nav = navigator as any;

type USBDevice = {
    productId: number;
    productName: string;
    vendorId: number;
    manufacturerName: string;
    serialNumber: string;
};

export default function UsbSelect() {
    const [selectedUsbDevice, setSelectedUsbDevice] = useLocalStorageState<USBDevice>(null, 'selectedUsbDevice');

    const [deviceList, setDeviceList] = useState<USBDevice[]>(selectedUsbDevice ? [selectedUsbDevice] : []);
    const [recordUsbConnect, setRecordUsbConnect] = useState(false);

    useEffect(() => {
        const signal = new AbortController();

        if (recordUsbConnect) {
            nav.usb.addEventListener("connect", event => {
                const newDevice = mapUsbDevice(event.device);

                if (deviceList.some(device => JSON.stringify(device) === JSON.stringify(newDevice))) {
                    return;
                }

                setDeviceList(prev => [...prev, newDevice]);
            }, { signal: signal.signal });
        }

        nav.usb.addEventListener("disconnect", event => {
            const disconnectedDevice = mapUsbDevice(event.device);

            setDeviceList(prev => prev.filter(device => device === selectedUsbDevice || JSON.stringify(device) !== JSON.stringify(disconnectedDevice)));
        }, { signal: signal.signal });

        return () => {
            signal.abort();
        };
    }, [recordUsbConnect]);

    return (
        <Stack flex={1} direction={'row'} justifyContent={'center'} px={8}>
            <Autocomplete
                open={recordUsbConnect}
                fullWidth
                options={deviceList}
                value={selectedUsbDevice}
                onChange={(_event, newValue) => setSelectedUsbDevice(newValue)}
                onOpen={() => setRecordUsbConnect(true)}
                onClose={() => setRecordUsbConnect(false)}
                getOptionLabel={option => `${option.manufacturerName} - ${option.productName} (${option.vendorId}:${option.productId})`}
                renderInput={params =>
                    <TextField
                        {...params}
                        label={'Selected USB-Device'}
                        fullWidth
                    />
                }
            />
        </Stack>
    );
}

function mapUsbDevice(device: ElectronUSBDevice): USBDevice {
    return {
        productId: device.productId,
        productName: device.productName,
        vendorId: device.vendorId,
        manufacturerName: device.manufacturerName,
        serialNumber: device.serialNumber
    };
}
