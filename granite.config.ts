import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "stumble-taste",
  brand: {
    displayName: "스텀블",
    primaryColor: "#C7FF79",
    icon: "https://static.toss.im/appsintoss/28139/8e1e9198-93d3-4678-b047-92808df5b0d0.png",
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
