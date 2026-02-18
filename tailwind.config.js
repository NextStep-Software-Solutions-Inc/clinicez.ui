/** @type {import('tailwindcss').Config} */
import tailwindTypography from '@tailwindcss/typography'
import fluid, { extract, screens, fontSize } from 'fluid-tailwind'

module.exports = {
  darkMode: 'class',
  content: {
    files: [
      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
      './src/**/*.{ts,tsx}',
    ],
    extract
  },
  prefix: "",
  theme: {
    screens,
    fontSize,
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          v2: "var(--primary-v2)",
          "foreground-v2": "var(--primary-foreground-v2)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          v2: "var(--secondary-v2)",
          "foreground-v2": "var(--secondary-foreground-v2)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // v2.0 text colors
        label: {
          v2: "var(--label-v2)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float-phase-1": {
          "0%, 100%": { transform: "translateY(0px)", opacity: "0.8" },
          "25%": { transform: "translateY(-8px)", opacity: "0.95" },
          "50%": { transform: "translateY(0px)", opacity: "0.85" },
          "75%": { transform: "translateY(6px)", opacity: "0.75" },
        },
        "float-phase-2": {
          "0%, 100%": { transform: "translateY(0px)", opacity: "0.75" },
          "25%": { transform: "translateY(6px)", opacity: "0.8" },
          "50%": { transform: "translateY(0px)", opacity: "0.9" },
          "75%": { transform: "translateY(-8px)", opacity: "0.85" },
        },
        "float-phase-3": {
          "0%, 100%": { transform: "translateY(0px)", opacity: "0.82" },
          "25%": { transform: "translateY(-4px)", opacity: "0.88" },
          "50%": { transform: "translateY(0px)", opacity: "0.8" },
          "75%": { transform: "translateY(4px)", opacity: "0.8" },
        },
        "shimmer-slow": {
          "0%, 100%": { "background-position": "0% center" },
          "50%": { "background-position": "100% center" },
        },
        "gradient-shift": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        "soft-glow": {
          "0%, 100%": { "box-shadow": "0 0 15px rgba(0, 0, 0, 0.1)" },
          "50%": { "box-shadow": "0 0 25px rgba(0, 0, 0, 0.15)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float-phase-1": "float-phase-1 8s ease-in-out infinite",
        "float-phase-2": "float-phase-2 8s ease-in-out infinite 1.3s backwards",
        "float-phase-3": "float-phase-3 8s ease-in-out infinite 2.6s backwards",
        "shimmer-slow": "shimmer-slow 6s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
        "gradient-shift": "gradient-shift 12s ease-in-out infinite",
        "soft-glow": "soft-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [fluid, require("tailwindcss-animate"), tailwindTypography],
}