/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        leftPaneBg: '#0e0e0e',
        rightPaneBg: '#1e1e1e',
        oBlue: '#09bfff',
        oRed: '#cc000c',
        oYellow : '#ffbe00',
        oGreen: '#0fcd4f',
        oGray: '#989898', 
        oGray2 : '#424242',
        oNight : "#ef4444"
        
      },
    },
  },
  plugins: [],
};

