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

export default function UsbSelect({ onSelectedUsbConnected, onSelectedUsbDisconnected }: {
    onSelectedUsbConnected: () => void;
    onSelectedUsbDisconnected: () => void;
}) {
    const [selectedUsbDevice, setSelectedUsbDevice] = useLocalStorageState<USBDevice>(null, 'selectedUsbDevice');
    const [isSelectedDeviceConnected, setIsSelectedDeviceConnected] = useState(false);

    const [deviceList, setDeviceList] = useState<USBDevice[]>(selectedUsbDevice ? [selectedUsbDevice] : []);
    const [recordUsbConnect, setRecordUsbConnect] = useState(false);

    useEffect(() => {
        const signal = new AbortController();

        nav.usb.addEventListener("connect", event => {
            const newDevice = mapUsbDevice(event.device);

            if (isSameDevice(selectedUsbDevice, newDevice)) {
                setIsSelectedDeviceConnected(true);
                onSelectedUsbConnected();
                return;
            }

            if (recordUsbConnect) {
                if (deviceList.some(device => isSameDevice(device, newDevice))) {
                    return;
                }

                setDeviceList(prev => [...prev, newDevice]);
            }
        }, { signal: signal.signal });

        nav.usb.addEventListener("disconnect", event => {
            const disconnectedDevice = mapUsbDevice(event.device);

            if (isSameDevice(selectedUsbDevice, disconnectedDevice)) {
                setIsSelectedDeviceConnected(false);
                onSelectedUsbDisconnected();
                return;
            }

            setDeviceList(prev => prev.filter(device => isSameDevice(device, disconnectedDevice)));
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
                onChange={(_event, newValue) => {
                    setSelectedUsbDevice(newValue);
                    setIsSelectedDeviceConnected(true);
                }}
                onOpen={() => setRecordUsbConnect(true)}
                onClose={() => setRecordUsbConnect(false)}
                getOptionLabel={option => option.productName}
                renderInput={params =>
                    <TextField
                        {...params}
                        color={isSelectedDeviceConnected ? 'success' : 'warning'}
                        focused={!!selectedUsbDevice}
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

function isSameDevice(device1: USBDevice, device2: USBDevice): boolean {
    return JSON.stringify(device1) === JSON.stringify(device2);
}
