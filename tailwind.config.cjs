// src와 index.html의 클래스 사용을 스캔해 필요한 Tailwind 스타일만 생성한다.
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {}
  },
  plugins: []
};
