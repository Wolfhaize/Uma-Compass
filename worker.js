export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    // If a client-side route (e.g. /tournaments/5) isn't a real file,
    // fall back to index.html so React Router can handle it.
    if (response.status === 404) {
      const indexUrl = new URL('/index.html', request.url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return response;
  },
};