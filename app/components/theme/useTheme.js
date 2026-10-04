'use client';
import { useOcearoContext } from '../context/OcearoContext';

/**
 * Colour tokens of the theme currently displayed (see themes.js). For canvas
 * drawings and the 3D scene; HTML should use the Tailwind classes, which read
 * the same tokens through CSS variables.
 */
const useTheme = () => useOcearoContext().tokens;

export default useTheme;
