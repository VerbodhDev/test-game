/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'space-black': '#000000',
                'cyber-cyan': '#00FFFF',
                'neon-magenta': '#FF00FF',
                'pixel-red': '#FF0000',
            },
            fontFamily: {
                'pixel': ['"Press Start 2P"', 'cursive'],
            },
        },
    },
    plugins: [],
}
