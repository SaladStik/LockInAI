/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // Static export so Electron can load from file:// in production builds.
  output: "export",
  // Relative asset paths only for the exported HTML (file://). In dev the Next.js
  // server expects absolute paths or HMR/RSC fetches break.
  assetPrefix: isProd ? "./" : undefined,
  trailingSlash: true,
  // next/image needs a server; the export uses unoptimized images.
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
