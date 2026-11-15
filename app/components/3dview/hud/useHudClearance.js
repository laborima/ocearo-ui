'use client';
import { useEffect } from 'react';

const CHECK_MS = 250;

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

// Every label checked by one timer: the HUD zones are measured once per round,
// all the reads come before any write, and a label's style is only written
// when it changes. One timer per label, each writing its style before the
// next one read the layout, forced a layout per label several times a second
// (6.7 % of the Pi's main thread with the AIS and current labels on).
const labels = new Set();
let timer = null;

const checkAll = () => {
    const zones = [...document.querySelectorAll('[data-hud-solid]')]
        .filter(zone => zone.offsetParent !== null)
        .map(zone => zone.getBoundingClientRect());
    const changes = [];
    labels.forEach((ref) => {
        const el = ref.current;
        if (!el) return;
        // A label hidden with visibility keeps its box: no need to show it to measure it
        const rect = el.getBoundingClientRect();
        const visibility = zones.some(zone => overlaps(rect, zone)) ? 'hidden' : 'visible';
        if (el.style.visibility !== visibility) changes.push([el, visibility]);
    });
    changes.forEach(([el, visibility]) => { el.style.visibility = visibility; });
};

/**
 * Hides a label drawn over the 3D scene (drei <Html>) while it would sit on a
 * HUD element: anything marked `data-hud-solid` (values, banner, cards,
 * toolbar). Checked a few times a second; the label comes back as soon as it
 * is clear.
 * @param {React.RefObject<HTMLElement>} ref - the label element
 */
const useHudClearance = (ref) => {
    useEffect(() => {
        labels.add(ref);
        if (!timer) timer = setInterval(checkAll, CHECK_MS);
        checkAll();
        return () => {
            labels.delete(ref);
            if (!labels.size) {
                clearInterval(timer);
                timer = null;
            }
        };
    }, [ref]);
};

export default useHudClearance;
