/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
'@huggingface/transformers',
'onnxruntime-node',
],outputFileTracingIncludes: {
    '/api/recommendation/[songId]': [
      './node_modules/onnxruntime-node/**/*',
      './node_modules/@huggingface/transformers/**/*',
    ],
  },

  outputFileTracingExcludes: {
    '/api/recommendation/[songId]': [
      './node_modules/onnxruntime-node/bin/napi-v3/darwin/**',
      './node_modules/onnxruntime-node/bin/napi-v3/win32/**',
      './node_modules/onnxruntime-node/bin/napi-v3/linux/arm64/**',
    ],
  },
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
