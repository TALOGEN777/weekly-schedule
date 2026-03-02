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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        schedule: {
          process: "hsl(var(--schedule-process))",
          "process-foreground": "hsl(var(--schedule-process-foreground))",
          cocoon: "hsl(var(--schedule-cocoon))",
          "cocoon-foreground": "hsl(var(--schedule-cocoon-foreground))",
          incubator: "hsl(var(--schedule-incubator))",
          "incubator-foreground": "hsl(var(--schedule-incubator-foreground))",
          "incubator-border": "hsl(var(--schedule-incubator-border))",
          hood: "hsl(var(--schedule-hood))",
          "hood-foreground": "hsl(var(--schedule-hood-foreground))",
          "hood-border": "hsl(var(--schedule-hood-border))",
          hover: "hsl(var(--schedule-hover))",
          dragover: "hsl(var(--schedule-dragover))",
          cd19: "hsl(var(--schedule-cd19))",
          "cd19-foreground": "hsl(var(--schedule-cd19-foreground))",
          cd22: "hsl(var(--schedule-cd22))",
          "cd22-foreground": "hsl(var(--schedule-cd22-foreground))",
          "cd19-1xx": "hsl(var(--schedule-cd19-1xx))",
          "cd19-1xx-foreground": "hsl(var(--schedule-cd19-1xx-foreground))",
          cd7: "hsl(var(--schedule-cd7))",
          "cd7-foreground": "hsl(var(--schedule-cd7-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
