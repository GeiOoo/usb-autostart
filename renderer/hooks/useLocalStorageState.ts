import { useEffect, useState } from 'react';

export default function useLocalStorageState<T>(defaultValue: T, localStorageKey: string): [T, React.Dispatch<React.SetStateAction<T>>] {
    const storeData = localStorage.getItem(localStorageKey);
    let storageValue = undefined;
    if (storeData) {
        try {
            storageValue = JSON.parse(storeData);
        } catch {
            storageValue = storeData;
        }
    }
    const [state, setState] = useState<T>(storageValue === undefined ? defaultValue : storageValue);

    useEffect(() => {
        if (state === undefined) {
            localStorage.removeItem(localStorageKey);
        } else {
            localStorage.setItem(localStorageKey, JSON.stringify(state));
        }
    }, [state]);

    return [state, setState];
}
