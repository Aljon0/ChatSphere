export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'chat-light-bg': '#D1D1D1',
          'chat-light-accent': '#DBDBDB',
          'chat-primary': '#85C7F2',
          'chat-dark-accent': '#636363',
          'chat-dark-bg': '#4C4C4C',
        }
      },
    },
    plugins: [],
  }