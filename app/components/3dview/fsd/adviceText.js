/**
 * One-line text of a course advice, e.g. "+7° → +0.4 kn VMG" or
 * "Avoid: 20° to starboard".
 */
export const formatAdvice = (advice, t) => {
    const deg = Math.round(Math.abs(advice.change) * 180 / Math.PI);
    if (advice.kind === 'standOn') return t('advice.standOn');
    if (advice.kind === 'avoid' && advice.noSolution) return t('advice.avoidNoSolution');
    if (advice.kind === 'avoid') {
        return t('advice.avoid', { deg, side: t(advice.change >= 0 ? 'advice.starboard' : 'advice.port') });
    }
    const sign = advice.change >= 0 ? '+' : '−';
    return t('advice.vmg', { change: `${sign}${deg}°`, gain: advice.gainKn.toFixed(1) });
};
