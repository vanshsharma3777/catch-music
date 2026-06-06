  /** @type {import('tailwindcss').Config} */
  export default {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./lib/**/*.{js,ts,jsx,tsx}",
    ],

    theme: {
      extend: {
        colors: {
          /* Backgrounds */
          "bg": "var(--background)",
          "bg-sec": "var(--background-secondary)",
          "bg-ter": "var(--background-tertiary)",

          /* Cards & Surfaces */
          card: "var(--card)",
          "card-hover": "var(--card-hover)",
          surface: "var(--surface)",

          /* Text */
          "pri": "var(--text-primary)",
          "sec": "var(--text-secondary)",
          "muted": "var(--text-muted)",

          /* Brand */
          primary: "var(--primary)",
          "primary-hover": "var(--primary-hover)",
          "primary-light": "var(--primary-light)",

          secondary: "var(--secondary)",
          "secondary-hover": "var(--secondary-hover)",

          accent: "var(--accent)",

          /* Borders */
          border: "var(--border)",
          "border-light": "var(--border-light)",

          /* Inputs */
          input: "var(--input-bg)",
          "input-border": "var(--input-border)",
          "input-focus": "var(--input-focus)",

          /* Status */
          success: "var(--success)",
          warning: "var(--warning)",
          error: "var(--error)",

          /* Animated Blob Colors */
          "blob-gold": "var(--blob-purple)",
          "blob-gold-sec": "var(--blob-blue)",
          "blob-gold-ter": "var(--blob-cyan)",
        },

        boxShadow: {
          sm: "var(--shadow-sm)",
          md: "var(--shadow-md)",
          lg: "var(--shadow-lg)",

          primary: "var(--shadow-primary)",
          cyan: "var(--shadow-cyan)",
        },

        borderRadius: {
          xl: "1rem",
          "2xl": "1.25rem",
          "3xl": "1.5rem",
        },
      },
    },

    plugins: [],
  };