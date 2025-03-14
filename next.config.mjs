/** @type {import('next').NextConfig} */
const nextConfig = { 
  reactStrictMode: process.env.NODE_ENV !== 'development', 
  output: 'export', 
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ocearo-ui' : '',
  images: {
    unoptimized: true // Disable image optimization for compatibility with export mode
  }
};

export default nextConfig;
