import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Next.js 15 dev server to serve HMR/assets to peers on the
  // M4's Tailscale IP so the app is testable from the laptop and elsewhere
  // in the tailnet. Production builds ignore this setting.
  allowedDevOrigins: ["100.72.169.113"],
};

export default nextConfig;
