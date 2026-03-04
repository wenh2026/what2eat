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
        "primary": "#FF7034",
        "primary-alt": "#ff621f",
        "coral-orange": "#FF7034",
        "background-light": "#FDFBF7",
        "background-dark": "#23150f",
        "background-soft": "#FDFDFD",
        "deep-charcoal": "#1A1A1A",
        "dark-grey": "#4B5563",
        "light-grey": "#F3F4F6",
        "off-white": "#F9FAFB",
        "card-border": "rgba(0, 0, 0, 0.04)",
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
    },
  },
  plugins: [],
}
