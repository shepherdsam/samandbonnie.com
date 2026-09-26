import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '127.0.0.1',
    '192.168.86.45', // Wi-Fi; DHCP can change this
    '100.115.162.47', // Tailscale
  ],
};

export default nextConfig;
