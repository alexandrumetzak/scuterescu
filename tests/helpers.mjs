import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
export const exists = (rel) => existsSync(path.join(ROOT, rel));

export function jsonLd(html) {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  return [...html.matchAll(re)].map((m) => JSON.parse(m[1]));
}

export function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : undefined;
}

export function imgTags(html) {
  return [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => ({
    src: attr(tag, 'src'),
    alt: attr(tag, 'alt'),
    width: attr(tag, 'width'),
    height: attr(tag, 'height'),
  }));
}

export function hrefs(html) {
  return [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
}
