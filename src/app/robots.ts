import { MetadataRoute } from "next";
import { resolveAppBaseUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const base = resolveAppBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
