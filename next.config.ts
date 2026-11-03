import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  serverExternalPackages: ["googleapis", "google-auth-library", "gaxios"],
};

export default nextConfig;
