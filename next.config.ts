import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "twuevnwxwqdjbjzwuglm.supabase.co",
        pathname: "/storage/v1/object/public/product-media/products/**",
      },
    ],
  },
};

export default nextConfig;
