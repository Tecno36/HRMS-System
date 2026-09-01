export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flyonui/dist/js/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("flyonui")
  ],
}