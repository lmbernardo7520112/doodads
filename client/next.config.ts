//client/next.config.ts

const nextConfig = {
  images: {
    remotePatterns: [
      //{ protocol: "https", hostname: "i.ytimg.com" },
      //{ protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "thumbs.dreamstime.com" },
      { protocol: "https", hostname: "www.shutterstock.com" }
    ],
  },
};
export default nextConfig;
