/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT"
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Allow-Control-Allow-Origin, Authorization"
          }
        ]
      },
      {
        // cache static PDFs aggressively in the browser
        source: "/pdfs/:path*",
        headers: [
          {
            key: "Cache-Control",
            // 30 days browser cache + immutable since templates rarely change
            value: "public, max-age=2592000, immutable"
          }
        ]
      }
    ];
  },
  transpilePackages: ["lucide-react"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*"
      }
    ]
  },
  env: {
    APP_BASE_URL:
      process.env.VERCEL_ENV === "preview"
        ? `https://${process.env.VERCEL_BRANCH_URL}`
        : "process.env.APP_BASE_URL"
  }
};

export default nextConfig;
