/**
 * 3D render profile. On a Raspberry Pi the GPU is fill-rate bound: drawing
 * fewer pixels (device pixel ratio 1, no MSAA) and fewer frames (30 fps, enough
 * for a scene that moves at boat speed) is what keeps the UI responsive.
 *
 * Config key `renderQuality`: 'auto' (default) | 'high' | 'pi'.
 */
import configService from '../settings/ConfigService';

export const RENDER_QUALITIES = ['auto', 'high', 'pi'];

/** ARM Linux (Raspberry Pi) or a small machine */
export const isLowPowerDevice = () => {
    if (typeof navigator === 'undefined') return false;
    if (/aarch64|armv7|armv8|arm64|raspbian|raspberry/i.test(navigator.userAgent)) return true;
    const cores = navigator.hardwareConcurrency || 8;
    const memory = navigator.deviceMemory || 8;
    return cores <= 4 && memory <= 4;
};

/**
 * @returns {{ id: 'high'|'pi', fps: number, dpr: number, antialias: boolean }}
 */
export const getRenderProfile = () => {
    const setting = configService.get('renderQuality') || 'auto';
    const pi = setting === 'pi' || (setting === 'auto' && isLowPowerDevice());
    if (pi) {
        return { id: 'pi', fps: 30, dpr: 1, antialias: false };
    }
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    return { id: 'high', fps: 60, dpr, antialias: true };
};
