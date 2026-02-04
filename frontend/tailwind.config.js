/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#6366f1",
        "primary-dark": "#4f46e5",
        "background-light": "#f9fafb",
        "background-dark": "#101622",
        "card-light": "#ffffff",
        "card-dark": "#1a2230",
        "text-main": "#111827",
        "text-secondary": "#6b7280",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
      borderRadius: { 
        "DEFAULT": "0.5rem", 
        "lg": "0.75rem", 
        "xl": "1rem", 
        "2xl": "1.5rem", 
        "full": "9999px" 
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
