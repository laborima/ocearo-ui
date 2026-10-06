'use client';
import { useEffect } from 'react';

const CHECK_MS = 250;

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * Hides a label drawn over the 3D scene (drei <Html>) while it would sit on a
 * HUD element: anything marked `data-hud-solid` (values, banner, cards,
 * toolbar). Checked a few times a second; the label comes back as soon as it
 * is clear.
 * @param {React.RefObject<HTMLElement>} ref - the label element
 */
const useHudClearance = (ref) => {
    useEffect(() => {
        const check = () => {
            const el = ref.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const hidden = [...document.querySelectorAll('[data-hud-solid]')]
                .some(zone => zone.offsetParent !== null && overlaps(rect, zone.getBoundingClientRect()));
            el.style.visibility = hidden ? 'hidden' : 'visible';
        };
        check();
        const timer = setInterval(check, CHECK_MS);
        return () => clearInterval(timer);
    }, [ref]);
};

export default useHudClearance;
