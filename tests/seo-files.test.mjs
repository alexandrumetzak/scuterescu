import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.mjs';

const URLS = [
  'https://scuterescu.ro/',
  'https://scuterescu.ro/en/',
  'https://scuterescu.ro/confidentialitate.html',
  'https://scuterescu.ro/en/privacy.html',
];

test('robots.txt allows all crawlers incl. AI and points to sitemap', () => {
  const robots = read('site/robots.txt');
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  for (const bot of ['GPTBot', 'PerplexityBot', 'Google-Extended', 'ClaudeBot']) {
    assert.ok(robots.includes(`User-agent: ${bot}`), `missing ${bot}`);
  }
  assert.ok(robots.includes('Sitemap: https://scuterescu.ro/sitemap.xml'));
});

test('sitemap lists all pages with hreflang alternates', () => {
  const sitemap = read('site/sitemap.xml');
  assert.ok(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  for (const url of URLS) assert.ok(sitemap.includes(`<loc>${url}</loc>`), `missing ${url}`);
  assert.equal((sitemap.match(/<url>/g) || []).length, 4);
  assert.ok(sitemap.includes('hreflang="en" href="https://scuterescu.ro/en/"'));
});

test('llms.txt starts with H1 and a summary blockquote', () => {
  const llms = read('site/llms.txt');
  assert.match(llms, /^# Scuterescu\n\n> .+/);
  assert.ok(llms.includes('https://scuterescu.ro/en/'));
});

test('_headers sets security and cache headers', () => {
  const headers = read('site/_headers');
  for (const h of ['X-Content-Type-Options: nosniff', 'Referrer-Policy:', 'Cache-Control:']) {
    assert.ok(headers.includes(h), `missing ${h}`);
  }
});
