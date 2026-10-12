/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no anunciar con qué está hecho el servidor
  // Si apuntas un subdominio que empiece por «reservas.» (por ejemplo reservas.tudominio.com) a esta misma app, su página de inicio es la
  // de reservas de las clientas y NUNCA la agenda interna (que solo vive en «/»).
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", has: [{ type: "host", value: "reservas\\..*" }], destination: "/reservar" }],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // las respuestas de la API nunca se guardan en cachés
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
