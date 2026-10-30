const SITE_URL = 'https://uma-compass.wolfhaize.workers.dev';
const DEFAULT_IMAGE = `${SITE_URL}/tazuna-modified.png`;

// Per-route embed content. Keys are exact pathnames; `/tournaments/:id`
// is handled separately below since it's dynamic.
const ROUTE_META = {
  '/': {
    title: 'Uma Compass (Beta)',
    description: 'Track reference and draft/strategy planning for Umamusume: Pretty Derby.',
  },
  '/tracks': {
    title: 'Track Reference — Uma Compass',
    description: 'Browse every track: distances, surfaces, corners, straights, and elevation, all in one reference.',
  },
  '/strategy': {
    title: 'Strategy Planner — Uma Compass',
    description: 'Plan race strategy phase-by-phase against real track data.',
  },
};

function metaForPath(pathname) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  return ROUTE_META['/'];
}

// Rewrite the placeholder <meta> tags in the HTML to match the route.
// Implemented as a streaming HTMLRewriter so we don't have to buffer
// the whole response body.
class MetaTagRewriter {
  constructor(meta, url) {
    this.meta = meta;
    this.url = url;
  }
  element(el) {
    const prop = el.getAttribute('property') || el.getAttribute('name');
    switch (prop) {
      case 'og:title':
      case 'twitter:title':
        el.setAttribute('content', this.meta.title);
        break;
      case 'og:description':
      case 'twitter:description':
      case 'description':
        el.setAttribute('content', this.meta.description);
        break;
      case 'og:url':
        el.setAttribute('content', this.url);
        break;
    }
  }
}

class TitleRewriter {
  constructor(meta) {
    this.meta = meta;
  }
  element(el) {
    el.setInnerContent(this.meta.title);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);

    // If a client-side route (e.g. /tracks) isn't a real file,
    // fall back to index.html so React Router can handle it.
    if (response.status === 404) {
      const indexUrl = new URL('/index.html', request.url);
      response = await env.ASSETS.fetch(new Request(indexUrl, request));
    }

    // Only rewrite HTML documents — leave assets (JS/CSS/images/etc.) untouched.
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    const meta = metaForPath(url.pathname);
    const canonicalUrl = `${SITE_URL}${url.pathname}`;

    return new HTMLRewriter()
      .on('title', new TitleRewriter(meta))
      .on('meta', new MetaTagRewriter(meta, canonicalUrl))
      .transform(response);
  },
};