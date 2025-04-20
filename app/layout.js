import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
    preload: false,
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
    preload: false,
});

export const metadata = {
    title: "Ocearo",
    description: "Sailing made smarter",
    manifest: './manifest.json', 
    icons: {
        icon: [
            { url: './favicon.ico', type: 'image/x-icon' },
            { url: './favicon.svg', type: 'image/svg+xml', sizes: 'any' },
            { url: './favicon-96x96.png', type: 'image/png', sizes: '96x96' }
        ],
        shortcut: './favicon.ico',
        apple: './apple-touch-icon.png',
    },
    appleWebApp: {
        capable: true,
        title: "Ocearo",
        statusBarStyle: 'black-translucent', 
    },
    formatDetection: {
        telephone: false,
    },
};


export const viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#4bbcd8' }, 
        { media: '(prefers-color-scheme: dark)', color: '#0a2e3d' }, 
    ],

    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, 
};


export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
