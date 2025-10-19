import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        display: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "hsl(var(--background))",
          dark: "hsl(var(--background-dark))",
        },
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
          hover: "hsl(var(--card-hover))",
        },
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-gold': 'var(--gradient-gold)',
        'gradient-leather': 'var(--gradient-leather)',
      },
      boxShadow: {
        'cinematic': 'var(--shadow-cinematic)',
        'gold': 'var(--shadow-gold-glow)',
        'focus': 'var(--shadow-focus)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        button: "var(--radius-button)",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in-bottom": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "logo-dramatic": {
          "0%": {
            transform: "scale(0) rotate(-180deg)",
            opacity: "0",
            filter: "blur(20px)",
          },
          "60%": {
            transform: "scale(1.1) rotate(10deg)",
            filter: "blur(0px)",
          },
          "80%": {
            transform: "scale(0.95) rotate(-5deg)",
          },
          "100%": {
            transform: "scale(1) rotate(0deg)",
            opacity: "1",
            filter: "blur(0px)",
          },
        },
        "beam-1": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" }
        },
        "beam-2": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "50%": { opacity: "0.8" },
          "100%": { transform: "translateX(-100%)", opacity: "0" }
        },
        "beam-3": {
          "0%": { transform: "translateX(-100%) scaleX(0.5)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateX(100%) scaleX(1)", opacity: "0" }
        },
        "beam-4": {
          "0%": { transform: "translateX(-120%) rotate(-15deg)", opacity: "0" },
          "40%": { opacity: "0.6" },
          "100%": { transform: "translateX(120%) rotate(-15deg)", opacity: "0" }
        },
        "beam-5": {
          "0%": { transform: "translateX(120%) rotate(15deg)", opacity: "0" },
          "40%": { opacity: "0.7" },
          "100%": { transform: "translateX(-120%) rotate(15deg)", opacity: "0" }
        },
        "beam-converge": {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "60%": { opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "0" }
        },
        "beam-fast-1": {
          "0%": { transform: "translateX(-150%)", opacity: "0" },
          "30%": { opacity: "1" },
          "100%": { transform: "translateX(150%)", opacity: "0" }
        },
        "beam-fast-2": {
          "0%": { transform: "translateX(150%)", opacity: "0" },
          "30%": { opacity: "1" },
          "100%": { transform: "translateX(-150%)", opacity: "0" }
        },
        "beam-fast-3": {
          "0%": { transform: "translateX(-150%)", opacity: "0" },
          "25%": { opacity: "0.8" },
          "100%": { transform: "translateX(150%)", opacity: "0" }
        },
        "beam-fast-4": {
          "0%": { transform: "translateX(150%)", opacity: "0" },
          "25%": { opacity: "0.7" },
          "100%": { transform: "translateX(-150%)", opacity: "0" }
        },
        "beam-diagonal-1": {
          "0%": { transform: "translateX(-100%) rotate(8deg)", opacity: "0" },
          "35%": { opacity: "0.9" },
          "100%": { transform: "translateX(100%) rotate(8deg)", opacity: "0" }
        },
        "beam-diagonal-2": {
          "0%": { transform: "translateX(100%) rotate(-8deg)", opacity: "0" },
          "35%": { opacity: "0.85" },
          "100%": { transform: "translateX(-100%) rotate(-8deg)", opacity: "0" }
        },
        "beam-diagonal-3": {
          "0%": { transform: "translateX(-120%) rotate(15deg)", opacity: "0" },
          "30%": { opacity: "0.7" },
          "100%": { transform: "translateX(120%) rotate(15deg)", opacity: "0" }
        },
        "beam-diagonal-4": {
          "0%": { transform: "translateX(120%) rotate(-15deg)", opacity: "0" },
          "30%": { opacity: "0.75" },
          "100%": { transform: "translateX(-120%) rotate(-15deg)", opacity: "0" }
        },
        "beam-converge-fast": {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "0" }
        },
        "logo-reveal": {
          "0%": {
            transform: "scale(0.5) translateZ(300px)",
            opacity: "0",
            filter: "blur(20px)"
          },
          "100%": {
            transform: "scale(1) translateZ(0)",
            opacity: "1",
            filter: "blur(0) drop-shadow(0 0 100px rgba(247, 201, 70, 0.9)) drop-shadow(0 0 50px rgba(247, 201, 70, 1))"
          }
        },
        "logo-push-reveal": {
          "0%": {
            transform: "scale(0.3) translateZ(500px)",
            opacity: "0",
            filter: "blur(30px)"
          },
          "100%": {
            transform: "scale(1) translateZ(0)",
            opacity: "1",
            filter: "blur(0) drop-shadow(0 0 120px rgba(247, 201, 70, 1)) drop-shadow(0 0 60px rgba(247, 201, 70, 1))"
          }
        },
        "logo-glow": {
          "0%": {
            filter: "drop-shadow(0 0 120px rgba(247, 201, 70, 0.9))"
          },
          "50%": {
            filter: "drop-shadow(0 0 160px rgba(247, 201, 70, 1)) drop-shadow(0 0 80px rgba(247, 201, 70, 1))"
          },
          "100%": {
            filter: "drop-shadow(0 0 80px rgba(247, 201, 70, 0.6)) drop-shadow(0 0 40px rgba(247, 201, 70, 0.8))"
          }
        },
        "logo-pulse-bright": {
          "0%": {
            filter: "drop-shadow(0 0 120px rgba(247, 201, 70, 1)) drop-shadow(0 0 60px rgba(247, 201, 70, 1))"
          },
          "50%": {
            filter: "drop-shadow(0 0 200px rgba(247, 201, 70, 1)) drop-shadow(0 0 100px rgba(247, 201, 70, 1)) drop-shadow(0 0 50px rgba(255, 255, 255, 0.8))"
          },
          "100%": {
            filter: "drop-shadow(0 0 50px rgba(247, 201, 70, 0.4)) drop-shadow(0 0 25px rgba(247, 201, 70, 0.6))"
          }
        },
        "logo-continuous-glow": {
          "0%, 100%": { 
            filter: "drop-shadow(0 0 50px rgba(247, 201, 70, 0.6)) drop-shadow(0 0 25px rgba(247, 201, 70, 0.8))",
            transform: "scale(1)"
          },
          "50%": { 
            filter: "drop-shadow(0 0 70px rgba(247, 201, 70, 0.9)) drop-shadow(0 0 35px rgba(247, 201, 70, 1))",
            transform: "scale(1.015)"
          }
        },
        "pulse-glow": {
          "0%, 100%": { 
            opacity: "0.08",
            transform: "scale(1)"
          },
          "50%": { 
            opacity: "0.15",
            transform: "scale(1.05)"
          }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
        "logo-dramatic": "logo-dramatic 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "beam-1": "beam-1 1.2s ease-out forwards",
        "beam-2": "beam-2 1.2s ease-out 0.1s forwards",
        "beam-3": "beam-3 1.2s ease-out 0.15s forwards",
        "beam-4": "beam-4 1.3s ease-out 0.05s forwards",
        "beam-5": "beam-5 1.3s ease-out 0.2s forwards",
        "beam-converge": "beam-converge 1.5s ease-in-out 0.3s forwards",
        "beam-fast-1": "beam-fast-1 1s ease-out forwards",
        "beam-fast-2": "beam-fast-2 1s ease-out 0.05s forwards",
        "beam-fast-3": "beam-fast-3 1s ease-out 0.1s forwards",
        "beam-fast-4": "beam-fast-4 1s ease-out 0.15s forwards",
        "beam-diagonal-1": "beam-diagonal-1 1.1s ease-out 0.08s forwards",
        "beam-diagonal-2": "beam-diagonal-2 1.1s ease-out 0.12s forwards",
        "beam-diagonal-3": "beam-diagonal-3 1.1s ease-out 0.05s forwards",
        "beam-diagonal-4": "beam-diagonal-4 1.1s ease-out 0.18s forwards",
        "beam-converge-fast": "beam-converge-fast 1.3s ease-in-out 0.4s forwards",
        "logo-reveal": "logo-reveal 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "logo-push-reveal": "logo-push-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "logo-pulse": "logo-glow 0.7s ease-in-out forwards",
        "logo-pulse-bright": "logo-pulse-bright 0.8s ease-in-out forwards",
        "logo-continuous-glow": "logo-continuous-glow 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
