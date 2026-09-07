import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/dashboard/mentee/directory",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/dashboard/mentee",
        destination: "/dashboard/profile",
        permanent: true,
      },
      {
        source: "/dashboard/settings/mentor",
        destination: "/dashboard/profile#mentor",
        permanent: true,
      },
      {
        source: "/dashboard/mentor/calendar",
        destination: "/dashboard/mentor",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
