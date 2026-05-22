import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "stumble-taste",
  brand: {
    displayName: "스텀블", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#C7FF79", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/28139/8e1e9198-93d3-4678-b047-92808df5b0d0.png", // 화면에노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
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
