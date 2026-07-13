import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Painel CONTROL",
    short_name: "CONTROL",
    description: "Dashboard Marketing · Comercial · Operacional — Control Consultoria e Marketing",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#2554f0",
    icons: [
      {
        src: "/logo-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
