export const site = {
  name: 'FREDDIE K.',
  title: 'FREDDIE K. — projects and experiments',
  description:
    'Hey, I’m Freddie. Lately, I’ve been exploring AI tools and how they fit into my day-to-day life.',
  origin: 'https://freddie-portfolio.pages.dev',
  ogImage: '/favicon.png',
  author: 'Freddie K.',
  xHandle: '@ktythaung',
};

export function absoluteUrl(path = '/') {
  return new URL(path, site.origin).toString();
}
