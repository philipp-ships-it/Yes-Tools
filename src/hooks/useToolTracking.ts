import { useEffect } from 'react';

export const useToolTracking = (toolId: string) => {
    useEffect(() => {
        try {
            const usage = JSON.parse(localStorage.getItem('tool-usage') || '{}');
            usage[toolId] = (usage[toolId] || 0) + 1;
            localStorage.setItem('tool-usage', JSON.stringify(usage));
        } catch (e) {
            console.error("Failed to track tool usage", e);
        }
    }, [toolId]);
};
