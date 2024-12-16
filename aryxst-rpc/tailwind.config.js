const { iconsPlugin, getIconCollections } = require("@egoist/tailwindcss-icons");

/** @type {import('tailwindcss').Config} */
export default {
 content: ["./src/views/**/*.{html,js}"],
 theme: {
  extend: {},
 },
 plugins: [
  require("@catppuccin/tailwindcss")({
   // prefix to use, e.g. `text-pink` becomes `text-ctp-pink`.
   // default is `false`, which means no prefix
   prefix: "ctp",
   // which flavour of colours to use by default, in the `:root`
   defaultFlavour: "mocha",
  }),
  iconsPlugin({
   // Select the icon collections you want to use
   // You can also ignore this option to automatically discover all individual icon packages you have installed
   // If you install @iconify/json, you should explicitly specify the collections you want to use, like this:
   collections: getIconCollections(["lucide"]),
   // If you want to use all icons from @iconify/json, you can do this:
   // collections: getIconCollections("all"),
   // and the more recommended way is to use `dynamicIconsPlugin`, see below.
  }),
 ],
};
