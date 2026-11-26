import "@fontsource-variable/geist";
import "@fontsource-variable/outfit";
import "@fontsource-variable/fraunces";
import "../src/app/globals.css";

/** @type { import('@storybook/nextjs-vite').Preview } */
const preview = {
  parameters: {
    layout: "padded",
    nextjs: { appDirectory: true },
    // Accessibility checks (addon-a11y) fail the story on violations.
    a11y: { test: "error" },
    viewport: {
      options: {
        mobile: { name: "Phone (390px)", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop (1440px)", styles: { width: "1440px", height: "900px" } },
      },
    },
  },
};

export default preview;
