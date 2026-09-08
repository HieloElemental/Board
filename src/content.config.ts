import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const commissionCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/commissions" }),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      character: z.string(),
      clientAlias: z.string().optional(),
      type: z.string(),
      progress: z.number().min(0).max(100),
      updatedAt: z.string(),
      status: z.enum(["waiting", "sketch", "lineart", "coloring", "completed"]),
      image: image().optional(),
    }),
});

export const collections = {
  commissions: commissionCollection,
};
