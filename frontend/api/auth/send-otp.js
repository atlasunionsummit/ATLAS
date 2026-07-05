export default async function handler(req, res) {
  // This endpoint has been completely disabled and deprecated due to security vulnerabilities (Open Relay).
  // Do not attempt to use this endpoint.
  return res.status(403).json({ message: 'Forbidden: Endpoint deprecated.' });
}
