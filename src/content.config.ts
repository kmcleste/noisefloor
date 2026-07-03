import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const BEATS = [
  "models",
  "frameworks",
  "agents",
  "providers",
  "oss",
  "enterprise",
  "rag",
  "vision",
] as const;

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    beats: z.array(z.enum(BEATS)).default([]),
    sources: z.array(z.string().url()).default([]),
  }),
});

export const collections = { posts };
