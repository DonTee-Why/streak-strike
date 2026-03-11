import path from "path";
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV !== "production";
const isDesktopExport = process.env.TAURI_DESKTOP_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  ...(isDesktopExport
    ? {
        output: "export" as const,
        images: {
          unoptimized: true,
        },
      }
    : {}),
};

export default withPWA({
  dest: "public",
  disable: isDev || isDesktopExport,
  register: true,
  skipWaiting: true,
})(nextConfig);
