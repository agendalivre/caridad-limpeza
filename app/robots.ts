import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/painel", "/painel/*"],
    },
    sitemap: "https://caridad-limpeza.vercel.app/sitemap.xml",
  };
}
