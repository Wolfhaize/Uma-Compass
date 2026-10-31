import { filtersFromSearch, filterTracks, filterSummaryParts, describeFilters } from './src/utils/filters.js';

const SITE_URL = 'https://uma-compass.wolfhaize.workers.dev';
const DEFAULT_IMAGE = `${SITE_URL}/tazuna-modified.png`;

// Per-route embed content. Keys are exact pathnames.
const ROUTE_META = {
  '/': {
    title: 'Uma Compass (Beta)',
    description: 'Track reference and draft/strategy planning for Umamusume: Pretty Derby.',
  },
  '/tracks': {
    title: 'Track Reference — Uma Compass',
    description: 'Browse every track: distances, surfaces, corners, straights, and elevation, all in one reference.',
  },
};

// A shared planner link (/?d=Sprint&s=Turf&a=final ...) gets a preview that
// describes the filters and how many tracks they match.
function plannerMetaFromSearch(search) {
  const filters = filtersFromSearch(search);
  if (!filters) return null;
  const count = filterTracks(filters).length;
  const parts = filterSummaryParts(filters);
  const shown = parts.length > 4 ? parts.slice(0, 4).join(' · ') + ` +${parts.length - 4} more` : parts.join(' · ');
  return {
    title: `Uma Compass: ${shown}`,
    description: `${count} matching track${count === 1 ? '' : 's'}. ${describeFilters(filters).join(' | ')}`,
  };
}

function metaForRequest(pathname, search) {
  if (pathname === '/') {
    const shared = plannerMetaFromSearch(search);
    if (shared) return shared;
  }
  return ROUTE_META[pathname] || ROUTE_META['/'];
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

    const meta = metaForRequest(url.pathname, url.search);
    const canonicalUrl = `${SITE_URL}${url.pathname}${url.search}`;

    return new HTMLRewriter()
      .on('title', new TitleRewriter(meta))
      .on('meta', new MetaTagRewriter(meta, canonicalUrl))
      .transform(response);
  },
};