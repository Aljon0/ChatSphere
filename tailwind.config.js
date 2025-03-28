export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "chat-light-bg": "#D1D1D1",
        "chat-light-accent": "#DBDBDB",
        "chat-primary": "#85C7F2",
        "chat-dark-accent": "#636363",
        "chat-dark-bg": "#4C4C4C",
        keyframes: {
          "slide-in": {
            "0%": { transform: "translateX(100%)", opacity: "0" },
            "100%": { transform: "translateX(0)", opacity: "1" },
          },
        },
        animation: {
          "slide-in": "slide-in 0.3s ease-out",
        },
      },
    },
  },
  plugins: [],
};
