import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "twuevnwxwqdjbjzwuglm.supabase.co",
        pathname: "/storage/v1/object/public/product-media/products/**",
      },
      // Exact T010 source references for the temporary Preview-only T037 review.
      { protocol: "https", hostname: "static.tildacdn.com", pathname: "/stor6630-3961-4934-b335-356663613332/43800746.png" },
      { protocol: "https", hostname: "static.tildacdn.com", pathname: "/stor6563-3966-4530-b565-383034623936/34557235.jpg" },
      { protocol: "https", hostname: "static.tildacdn.com", pathname: "/tild6165-3361-4466-a636-356135656166/bleu-fleuri-v-intere.jpg" },
    ],
  },
};

export default nextConfig;
