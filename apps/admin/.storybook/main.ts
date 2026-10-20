import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";

const config: StorybookConfig = {
  // The registration module has its own build boundary and is intentionally
  // excluded from the Admin app tsconfig. Its legacy story is therefore not a
  // valid Admin Storybook entry until that module is migrated back in.
  stories: ["../src/**/!(*registration).stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  docs: { autodocs: "tag" },
  framework: "@storybook/react-vite",
  staticDirs: ["../public"],
  async viteFinal(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": fileURLToPath(new URL("../src", import.meta.url)),
    };
    return config;
  },
};

export default config;
