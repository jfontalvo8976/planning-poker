import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['socket.io'],
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: '/api/socketio',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
