import { getCollection } from 'astro:content';

export type LinkKind = 'primary' | 'slides' | 'poster' | 'secondary';

// Talks from src/data/talks.yaml, split into upcoming (soonest first) and past
// (newest first). Decided at build time; a talk counts as given on its own day.
export async function getTalks() {
  const talks = (await getCollection('talks')).map(({ id, data }) => {
    const links: { href: string; label: string; kind: LinkKind }[] = [];
    if (data.youtube) links.push({ href: `https://www.youtube.com/watch?v=${data.youtube}`, label: 'Watch on YouTube →', kind: 'primary' });
    if (data.slides) links.push({ href: data.slides, label: 'Slides', kind: 'slides' });
    if (data.poster) links.push({ href: data.poster.src, label: 'Poster', kind: 'poster' });
    const hasMain = links.length > 0;
    data.links.forEach((l, i) => links.push({ ...l, kind: !hasMain && i === 0 ? 'primary' : 'secondary' }));
    return { ...data, id, date: data.date.toISOString().slice(0, 10), links };
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = talks.filter((t) => t.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const past = talks.filter((t) => t.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}
