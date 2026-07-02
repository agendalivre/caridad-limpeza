import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://caridad-limpeza.vercel.app";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/reservar`, changeFrequency: "weekly", priority: 0.9 },
  ];
}
