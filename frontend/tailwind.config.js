/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom NotebookLM-inspired dark theme
                zinc: {
                    850: '#1f1f1f',
                    950: '#0a0a0a',
                },
                teal: {
                    400: '#00bfa5',
                    500: '#00a88f',
                }
            },
            fontFamily: {
                sans: ['Google Sans', 'Segoe UI', 'Roboto', '-apple-system', 'sans-serif'],
            },
            spacing: {
                // 8px spacing system
                '0.5': '2px',
                '1': '4px',
                '2': '8px',
                '3': '12px',
                '4': '16px',
                '5': '20px',
                '6': '24px',
                '8': '32px',
                '10': '40px',
                '12': '48px',
            },
            borderRadius: {
                'lg': '8px',
                'xl': '12px',
                '2xl': '16px',
            },
            boxShadow: {
                'sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
                'md': '0 4px 8px rgba(0, 0, 0, 0.4)',
                'lg': '0 8px 16px rgba(0, 0, 0, 0.5)',
            },
            transitionDuration: {
                '200': '200ms',
            },
            transitionTimingFunction: {
                'out': 'cubic-bezier(0.33, 1, 0.68, 1)',
            },
            animation: {
                'fade-in': 'fadeIn 200ms ease-out',
                'slide-up': 'slideUp 200ms ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(8px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
