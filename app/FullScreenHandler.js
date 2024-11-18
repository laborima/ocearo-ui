import { useEffect } from 'react';

const FullscreenHandler = () => {
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('fullscreen') === 'true') {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        }
    }, []);

    return null; // This component doesn't render anything visually
};

export default FullscreenHandler;
