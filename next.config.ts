import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Suppress invalid source map warnings from third-party libraries
  productionBrowserSourceMaps: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Suppress "URL constructor: is not a valid URL" source map warnings
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { message: /Failed to parse source map/ },
        { message: /is not a valid URL/ },
      ];
    }
    return config;
  },
};

export default nextConfig;
