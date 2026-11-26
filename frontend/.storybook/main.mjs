// Storybook: look at and test each UI component on its own (extra credit: UI tests).
//   npm run storybook         -> opens http://localhost:6006
//   npm run build-storybook   -> static site in storybook-static/
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

/** @type { import('@storybook/nextjs-vite').StorybookConfig } */
const config = {
  stories: ["../src/**/*.stories.@(js|jsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  staticDirs: ["../public"],
  async viteFinal(viteConfig) {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    // Same "@/..." shortcut as jsconfig.json
    viteConfig.resolve = viteConfig.resolve ?? {};
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias ?? {}),
      "@": fileURLToPath(new URL("../src", import.meta.url)),
    };
    return viteConfig;
  },
};

export default config;
