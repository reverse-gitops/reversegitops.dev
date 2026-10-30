import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const talks = defineCollection({
  loader: file('src/data/talks.yaml'),
  schema: z.object({
    speaker: z.string(),
    event: z.string(),
    date: z.coerce.date(),
    place: z.string(),
    virtual: z.boolean().default(false),
    schedule: z.string().optional(),
    title: z.string(),
    abstract: z.array(z.string()).min(1),
    youtube: z.string().optional(),
    slides: z.string().optional(),
    poster: z
      .object({
        src: z.string(),
        alt: z.string(),
        width: z.number(),
        height: z.number(),
      })
      .optional(),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

const implementations = defineCollection({
  loader: file('src/data/implementations.yaml'),
  schema: z.object({
    name: z.string(),
    by: z.string(),
    repo: z.string().url(),
    description: z.array(z.string()).min(1),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

export const collections = { talks, implementations };
