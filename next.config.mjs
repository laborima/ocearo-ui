/** @type {import('next').NextConfig} */
const nextConfig = { output: 'export', assetPrefix: process.env.NODE_ENV === 'production' ? '/ocearo-ui/' : '' };

export default nextConfig;
