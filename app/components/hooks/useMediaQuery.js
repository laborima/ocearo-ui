'use client';
import { useEffect, useState } from 'react';

/**
 * Whether a CSS media query matches, kept up to date on resize and rotation.
 * False during the static export's prerender (no window).
 * @param {string} query - e.g. '(min-width: 1024px)'
 * @returns {boolean}
 */
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const update = () => setMatches(mql.matches);
        update();
        mql.addEventListener('change', update);
        return () => mql.removeEventListener('change', update);
    }, [query]);

    return matches;
};

export default useMediaQuery;
