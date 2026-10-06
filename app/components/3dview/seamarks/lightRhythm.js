/**
 * Light rhythms of the IALA / chart abbreviations (F, Fl, LFl, Q, VQ, UQ,
 * Iso, Oc, Mo) as on/off sequences over the period, so a mark's light can
 * be animated: Fl(3) 10s, Q(6)+LFl 15s, VQ(9) 10s, Iso 4s…
 */

const QUICK = { Q: 1, IQ: 1, VQ: 0.5, IVQ: 0.5, UQ: 0.25, IUQ: 0.25 };

/**
 * Sequence of [on, off] seconds for one period, null for a fixed light.
 * @param {{character: string, group?: string, period?: number}} light
 * @param {boolean} [southCardinal] - Q(6)/VQ(6) of a south cardinal end with a long flash
 */
export const lightSequence = ({ character, group, period }, southCardinal = false) => {
    // "Q+LFl", "VQ(6)+LFl": the long flash after the group
    const [base, ...extra] = String(character || '').split('+');
    const longFlash = southCardinal || extra.some((e) => /LFl/.test(e)) || /LFl/.test(String(group));
    const c = base.replace(/[^A-Za-z.]/g, '');
    const kind = c.split('.').pop();
    const n = Math.max(1, parseInt(group, 10) || 1);
    const steps = [];
    let P = Number.isFinite(period) && period > 0 ? period : null;

    if (kind === 'F') return null;
    if (QUICK[c] || QUICK[kind]) {
        const rate = QUICK[c] || QUICK[kind];
        // Without a group, Q+LFl is the south cardinal's Q(6)+LFl
        const flashes = parseInt(group, 10) ? n : (longFlash ? 6 : (P ? Math.round(P / rate) : 1));
        for (let i = 0; i < flashes; i++) steps.push([rate * 0.35, rate * 0.65]);
        if (longFlash) steps.push([2, 1]);
        P = P || flashes * rate;
    } else if (kind === 'Iso') {
        P = P || 4;
        steps.push([P / 2, P / 2]);
    } else if (kind === 'Oc') {
        // Mostly lit, n short eclipses
        P = P || 4;
        for (let i = 0; i < n; i++) steps.push([i === 0 ? 0 : 1, 1]);
    } else if (kind === 'LFl') {
        P = P || 10;
        for (let i = 0; i < n; i++) steps.push([2, 1.5]);
    } else if (kind === 'Mo') {
        P = P || 8;
        steps.push([1.5, 0.5]);
    } else {
        // Fl and anything unknown: n flashes of 0.5 s
        P = P || (n === 1 ? 5 : 1.5 * n + 4);
        for (let i = 0; i < n; i++) steps.push([0.5, 1]);
    }
    const used = steps.reduce((s, [on, off]) => s + on + off, 0);
    // The rest of the period is dark (lit for occulting lights)
    const rest = Math.max(0, P - used);
    return { steps, rest, restOn: kind === 'Oc', period: Math.max(P, used) };
};

/** Whether the light is lit `t` seconds into its cycle */
export const isLit = (sequence, t) => {
    if (!sequence) return true;
    let phase = ((t % sequence.period) + sequence.period) % sequence.period;
    for (const [on, off] of sequence.steps) {
        if (phase < on) return true;
        phase -= on;
        if (phase < off) return false;
        phase -= off;
    }
    return sequence.restOn;
};
