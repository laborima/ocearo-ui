import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Ocearo",
  description: "Sailing made smarter",
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      {/* PWA Manifest */}
      <link rel="manifest" href={`${process.env.ASSET_PREFIXL}/manifest.json`} />
              <meta name="theme-color" content="#4bbcd8" />
              <link rel="icon" type="image/png" href={`${process.env.ASSET_PREFIXL}/favicon-96x96.png`} sizes="96x96" />
              <link rel="icon" type="image/svg+xml" href={`${process.env.ASSET_PREFIXL}/favicon.svg`} />
              <link rel="shortcut icon" href={`${process.env.ASSET_PREFIXL}/favicon.ico`} />
              <link rel="apple-touch-icon" sizes="180x180" href={`${process.env.ASSET_PREFIXL}/apple-touch-icon.png`} />
              <meta name="apple-mobile-web-app-title" content="Ocearo" />
       </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
