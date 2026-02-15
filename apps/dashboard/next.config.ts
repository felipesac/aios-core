import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize native modules that can't be bundled
  serverExternalPackages: ['chokidar', 'fs-extra', 'js-yaml'],
};

export default nextConfig;
