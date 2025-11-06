import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme"; 

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
   
        inter: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'mani-pink': {
          '50': '#FFF0F6',
          '100': '#FFE3ED',
          '200': '#FFCBE0',
          '300': '#FFA8CA',
          '400': '#FF78AD',
          '500': '#FF4C93',
          '600': '#E62E7A', 
          '700': '#C01A62',
          '800': '#9F1751',
          '900': '#851846',
          '950': '#500826',
        },
      }
    },
  },
  plugins: [],
};
export default config;