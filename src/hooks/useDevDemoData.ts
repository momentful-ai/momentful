import { useState, useEffect } from 'react';

export const DEMO_DATA_KEY = 'DEV_DEMO_DATA';

export function useDevDemoData() {
    const [isEnabled, setIsEnabled] = useState(() => {
        if (typeof localStorage === 'undefined') return false;
        return localStorage.getItem(DEMO_DATA_KEY) === 'true';
    });

    useEffect(() => {
        const handleToggle = (e: CustomEvent<{ enabled: boolean }>) => {
            setIsEnabled(e.detail.enabled);
        };

        window.addEventListener('dev-demo-data-toggle', handleToggle as EventListener);
        return () => {
            window.removeEventListener('dev-demo-data-toggle', handleToggle as EventListener);
        };
    }, []);

    return isEnabled;
}
