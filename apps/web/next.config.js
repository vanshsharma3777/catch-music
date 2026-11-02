/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
'@huggingface/transformers',
'onnxruntime-node',
],
     async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "http://localhost:3002" },
          { key: "Access-Control-Allow-Origin", value: process.env.JIO_SAVAAN_WORKER },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
