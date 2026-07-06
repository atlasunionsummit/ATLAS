export default function handler(req, res) {
  return res.status(404).json({ message: "Not Found - Deprecated Endpoint" });
}
