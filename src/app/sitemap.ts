import { MetadataRoute } from "next";
import { listPremadeFits, listProductsWithVariants } from "@/lib/store-db";
import { resolveAppBaseUrl } from "@/lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveAppBaseUrl();
  const staticRoutes = [
    "/",
    "/shop",
    "/clothes",
    "/pants-jeans",
    "/shoes",
    "/hoodies",
    "/accessories",
    "/premade-fits",
    "/outfit-builder",
    "/reviews",
    "/shipping-policy",
    "/policy",
    "/contact",
  ];
  const productRoutes = listProductsWithVariants().map((product) => `/product/${product.slug}`);
  const premadeFitRoutes = listPremadeFits().map((fit) => `/premade-fits/${fit.slug}`);
  return [...staticRoutes, ...productRoutes, ...premadeFitRoutes].map((route) => ({
    url: `${base}${route}`,
    changeFrequency: "daily",
    priority: route === "/" ? 1 : route.startsWith("/product") ? 0.8 : 0.7,
    lastModified: new Date(),
  }));
}
