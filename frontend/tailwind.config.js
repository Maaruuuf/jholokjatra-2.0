/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", ink: "var(--text)", muted: "var(--muted)", accent: "var(--accent)",
        go: "var(--go)", caution: "var(--caution)", avoid: "var(--avoid)",
      },
      borderRadius: { neu: "22px" },
    },
  },
  plugins: [],
};
