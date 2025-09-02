// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Existing redirects (if any)
    const existing = [];

    return [
      ...existing,
      { source: '/plans', destination: '/pricing', permanent: true },
      { source: '/signin', destination: '/login', permanent: true },
      { source: '/add-skis', destination: '/skis/create', permanent: true },
      { source: '/manage-locked-skis', destination: '/skis/locked', permanent: true },
    ];
  },
};

export default nextConfig;
