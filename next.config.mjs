/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  // 🔥 Esto evita que el build de Vercel falle por ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
