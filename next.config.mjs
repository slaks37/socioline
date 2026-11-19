const service = process.env.WORLD_BACKEND_URL || "http://127.0.0.1:4100";
export default {
  async rewrites() {
    return [{ source: "/realm/:path*", destination: service + "/:path*" }];
  },
};
