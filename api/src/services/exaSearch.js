import Exa from 'exa-js';

/**
 * Server-only Exa web search.
 *
 * The Exa client reads the key from the environment; EXA_API_KEY must never be
 * exposed to the browser (no REACT_APP_ prefix, no import of this file from the
 * client). This module is only ever loaded by the API route handler.
 */

// How many results the feature shows. Exa has no pagination, so this is the
// only knob for breadth (Exa allows up to 100).
const NUM_RESULTS = 5;

// Upstream Exa failures -> a message the feature can display. We deliberately
// do NOT pass an upstream 401 straight through: the client treats any 401 as a
// dead session and signs the user out, so a bad Exa key would look like logout.
// Everything that is not a rate limit becomes a 502 Bad Gateway instead.
const upstreamMessage = (status) => {
  if (status === 401) return 'Exa rejected the server API key (401). Check EXA_API_KEY.';
  if (status === 402) return 'Exa credits are exhausted (402). Add credits in the Exa dashboard.';
  if (status === 429) return 'Exa rate limit reached (429). Try again in a moment.';
  return null;
};

const asApiError = (err) => {
  const status = err?.response?.status ?? err?.status ?? err?.statusCode;
  const known = upstreamMessage(status);
  const error = new Error(
    known || `Exa search failed${status ? ` (${status})` : ''}${err?.message ? `: ${err.message}` : ''}`
  );
  error.statusCode = status === 429 ? 429 : 502;
  error.upstreamStatus = status;
  return error;
};

let client;

/** Build the Exa client once, failing loudly when the key is not configured. */
const getClient = () => {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    const error = new Error('Exa is not configured: EXA_API_KEY is missing on the server.');
    error.statusCode = 503;
    throw error;
  }
  if (!client) client = new Exa(apiKey);
  return client;
};

/** Keep only the fields the feature renders. */
const toResult = (r) => ({
  title: r?.title ?? null,
  url: r?.url ?? '',
  author: r?.author ?? null,
  publishedDate: r?.publishedDate ?? null,
  highlights: Array.isArray(r?.highlights) ? r.highlights : [],
});

/**
 * Run one search and return the display fields.
 * @param {string} query
 * @returns {Promise<Array<{title: string|null, url: string, author: string|null, publishedDate: string|null, highlights: string[]}>>}
 */
export const searchWeb = async (query) => {
  const exa = getClient();
  try {
    const { results } = await exa.search(query, {
      type: 'auto',
      numResults: NUM_RESULTS,
      contents: { highlights: true },
    });
    return (results || []).map(toResult);
  } catch (err) {
    throw asApiError(err);
  }
};

export default searchWeb;
