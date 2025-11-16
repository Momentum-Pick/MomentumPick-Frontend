module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,jsx,js}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        gain: "hsl(var(--gain))",
        loss: "hsl(var(--loss))",

        "gain-card": "hsl(var(--gain-card))",
        "loss-card": "hsl(var(--loss-card))",

        "gain-border": "hsl(var(--gain-border))",
        "loss-border": "hsl(var(--loss-border))",
        // card colors: allows using `bg-card` and `text-card-foreground`
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
      },
    },
  },
  plugins: [],
};
