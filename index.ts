// artifacts/api-server/api/index.ts
// Vercel serverless entry point.
// Vercel looks for a default export in this file and calls it
// as a Node.js HTTP handler. Exporting the Express app directly
// works because Express apps implement the (req, res) signature.

import app from '../src/app.js';

export default app;
