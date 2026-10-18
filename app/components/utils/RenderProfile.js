/**
 * 3D render profile. On a Raspberry Pi the GPU is fill-rate bound: drawing
 * fewer pixels (75 % resolution, no MSAA, no backdrop blur on the HUD) and
 * fewer frames (30 fps, enough for a scene that moves at boat speed) is what
 * keeps the UI responsive.
 *
 * Config key `renderQuality`: 'auto' (default) | 'high' | 'pi'.
 */
import configService from '../settings/ConfigService';

export const RENDER_QUALITIES = ['auto', 'high', 'pi'];

// The Raspberry Pi's GPU (V3D / VideoCore) and software rendering. Not the
// phone GPUs (Mali, Adreno, PowerVR, Apple): a phone draws the full profile
// fine, and the reduced one looked blurry on it
const LOW_POWER_GPU = /v3d|videocore|llvmpipe|swiftshader/i;
const MOBILE = /android|iphone|ipad|ipod|mobile/i;

let gpuName;
/** WebGL renderer string ('V3D 7.1.7.0' on a Pi 5), read once */
const gpuRenderer = () => {
    if (gpuName !== undefined) return gpuName;
    gpuName = '';
    try {
        const gl = document.createElement('canvas').getContext('webgl');
        const ext = gl?.getExtension('WEBGL_debug_renderer_info');
        gpuName = String(gl?.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
        // No WebGL here: the 3D view will not run anyway
    }
    return gpuName;
};

/**
 * ARM Linux (Raspberry Pi) or a small machine. Chromium's reduced user agent
 * says "Linux x86_64" on ARM too, and a Pi 5 reports 8 GB: the GPU is what
 * gives it away.
 */
export const isLowPowerDevice = () => {
    if (typeof navigator === 'undefined') return false;
    if (LOW_POWER_GPU.test(gpuRenderer())) return true;
    // Phones and tablets: full quality (their ARM user agent and 4 GB are not a Pi)
    if (MOBILE.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)) return false;
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
        // 3D at 75 % of the screen resolution, upscaled: a third more frames on
        // the Pi 5 (measured 9 -> 12 fps with the HUD and KIP running)
        return { id: 'pi', fps: 30, dpr: 0.75, antialias: false };
    }
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    return { id: 'high', fps: 60, dpr, antialias: true };
};
