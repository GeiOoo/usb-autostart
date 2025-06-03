import { Autocomplete, Stack, TextField } from '@mui/material';
import { USBDevice as ElectronUSBDevice } from 'electron/renderer';
import { useEffect, useMemo, useState } from 'react';
import useLocalStorageState from '../hooks/useLocalStorageState';

const nav = navigator as any;

type USBDevice = {
    productId: number,
    productName: string,
    vendorId: number,
    manufacturerName: string,
    serialNumber: string,
};

export default function UsbSelect({ onSelectedUsbConnected, onSelectedUsbDisconnected }: {
    onSelectedUsbConnected: () => void,
    onSelectedUsbDisconnected: () => void,
}) {
    const [ selectedUsbDevice, setSelectedUsbDevice ] = useLocalStorageState<USBDevice | null>(null, 'selectedUsbDevice');
    const [ deviceList, setDeviceList ] = useState<USBDevice[]>([]);

    const isSelectedDeviceConnected = useMemo(() => {
        return selectedUsbDevice && deviceList.some(device => isSameDevice(device, selectedUsbDevice));
    }, [ selectedUsbDevice, deviceList ]);

    useEffect(() => {
        nav.usb.getDevices().then((devices: ElectronUSBDevice[]) => {
            const mappedDevices = devices.map(device => mapUsbDevice(device));
            setDeviceList(mappedDevices);
        });

        const signal = new AbortController();

        nav.usb.addEventListener('connect', (event: any) => {
            const newDevice = mapUsbDevice(event.device);

            if (isSameDevice(selectedUsbDevice, newDevice)) {
                onSelectedUsbConnected();
            }

            setDeviceList(prev => [ ...prev, newDevice ]);
        }, { signal: signal.signal });

        nav.usb.addEventListener('disconnect', (event: any) => {
            const disconnectedDevice = mapUsbDevice(event.device);

            if (isSameDevice(selectedUsbDevice, disconnectedDevice)) {
                onSelectedUsbDisconnected();
            }

            setDeviceList(prev => prev.filter(device => !isSameDevice(device, disconnectedDevice)));
        }, { signal: signal.signal });

        return () => {
            signal.abort();
        };
    }, [ onSelectedUsbConnected, onSelectedUsbDisconnected, selectedUsbDevice ]);

    return (
        <Stack
            direction={'row'}
            flex={1}
            justifyContent={'center'}
            px={8}
        >
            <Autocomplete
                getOptionLabel={option => option.productName}
                onChange={(_event, newValue) => setSelectedUsbDevice(newValue)}
                options={deviceList}
                size="small"
                value={selectedUsbDevice}
                renderInput={params => (
                    <TextField
                        {...params}
                        color={isSelectedDeviceConnected ? 'success' : 'warning'}
                        focused={!!selectedUsbDevice}
                        label={'Selected USB-Device'}
                        fullWidth
                    />
                )}
                fullWidth
            />
        </Stack>
    );
}

function mapUsbDevice(device: ElectronUSBDevice): USBDevice {
    return {
        productId: device.productId,
        productName: device.productName ? device.productName : `Unknown Device (${device.productId}:${device.vendorId})`,
        vendorId: device.vendorId,
        manufacturerName: device.manufacturerName ?? 'Unknown Manufacturer',
        serialNumber: device.serialNumber ?? 'Unknown Serial Number',
    };
}

function isSameDevice(device1: USBDevice | null, device2: USBDevice): boolean {
    if (device1 === null) {
        return false;
    }

    return JSON.stringify(device1) === JSON.stringify(device2);
}
