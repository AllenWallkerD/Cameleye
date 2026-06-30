import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pin the workspace root so the stray ~/package-lock.json doesn't confuse Turbopack
  turbopack: { root: import.meta.dirname },
  // hide the floating Next.js dev-tools indicator in the corner
  devIndicators: false,
  // allow testing the dev server from a phone on the LAN (cross-origin)
  allowedDevOrigins: ["172.16.150.68"],
};

export default nextConfig;
