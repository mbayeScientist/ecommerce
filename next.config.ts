import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimisations de production
  output: 'standalone',
  poweredByHeader: false,
  
  // Configuration des images
  images: {
    domains: [
      'lh3.googleusercontent.com', // Pour les images de profil Google
      'localhost', // Pour le développement local
      'votre-bucket-supabase.supabase.co', // Pour les images stockées sur Supabase
    ],
    minimumCacheTTL: 60,
  },
  
  // Sécurité
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ],
};

export default nextConfig;
