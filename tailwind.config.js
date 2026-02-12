/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    cyan: '#25d1f4',
                    dark: '#0a0a0c',
                    surface: 'rgba(20, 20, 25, 0.7)',
                },
                cyber: {
                    pink: '#ff003c',
                    yellow: '#f2a900',
                    green: '#00ff41'
                }
            },
            fontFamily: {
                sans: ['Space Grotesk', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            borderRadius: {
                'custom': '8px',
            },
            backdropBlur: {
                'glass': '12px',
            }
        },
    },
    plugins: [],
}
