/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le immagini base64 degli screenshot Whoop passano nel body delle API route
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
