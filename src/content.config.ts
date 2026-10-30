import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import yaml from 'js-yaml';

const API_VERSION = 'reversegitops.dev/v1alpha1';

// The data files hold Kubernetes-style objects (apiVersion/kind/metadata/spec),
// one YAML document each. metadata.name becomes the entry id and the spec
// fields become the entry data; apiVersion and kind stay so the schemas can
// check them.
const krm = (text: string) =>
  yaml
    .loadAll(text)
    .filter(Boolean)
    .map((doc: any) => ({ id: doc.metadata?.name, apiVersion: doc.apiVersion, kind: doc.kind, ...doc.spec }));

const talks = defineCollection({
  loader: file('src/data/talks.yaml', { parser: krm }),
  schema: z.object({
    apiVersion: z.literal(API_VERSION),
    kind: z.literal('Talk'),
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
  loader: file('src/data/implementations.yaml', { parser: krm }),
  schema: z.object({
    apiVersion: z.literal(API_VERSION),
    kind: z.literal('Implementation'),
    name: z.string(),
    by: z.string(),
    repo: z.string().url(),
    description: z.array(z.string()).min(1),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

export const collections = { talks, implementations };
