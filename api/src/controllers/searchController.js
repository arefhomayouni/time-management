import { catchAsync } from 'vanta-api';

// Loaded on demand: the Exa SDK (and this service) is only needed by this one
// route, so the API keeps booting and every other route keeps working before
// `npm install` has pulled the pinned exa-js in.
const loadSearch = async () => {
  try {
    return await import('../services/exaSearch.js');
  } catch (err) {
    if (err && err.code === 'ERR_MODULE_NOT_FOUND') {
      const missing = new Error(
        'Exa SDK (exa-js) is not installed on the server. Run "npm install" in api/.'
      );
      missing.statusCode = 503;
      throw missing;
    }
    throw err;
  }
};

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Web search via Exa
 *     description: Runs a single Exa web search and returns the fields the UI shows (title, url, highlights). The Exa API key stays on the server.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, example: 'time tracking best practices' }
 *     responses:
 *       200:
 *         description: Results returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     query: { type: string }
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title: { type: string, nullable: true }
 *                           url: { type: string }
 *                           author: { type: string, nullable: true }
 *                           publishedDate: { type: string, nullable: true }
 *                           highlights: { type: array, items: { type: string } }
 *       400:
 *         description: Missing or invalid query
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       503:
 *         description: Exa is not configured on the server
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
export const searchWeb = catchAsync(async (req, res, next) => {
  const query = String(req.query.q || '').trim();

  const { searchWeb: run } = await loadSearch();
  const results = await run(query);

  res.status(200).json({
    success: true,
    data: { query, results },
  });
});
