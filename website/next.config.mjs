/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export -> ./out, ready to drop on Cloudflare Pages.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // This site has its own lockfile next to the Electron app's — pin the root.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
