const admin = require("../utils/firebaseAdmin");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const db = admin.firestore();

    // Fetch delegates and registrations securely from the backend
    const [delegatesSnap, registrationsSnap] = await Promise.all([
      db.collection("delegates").get(),
      db.collection("registrations").where("status", "==", "pending_verification").get()
    ]);

    const occ = {};
    const stubDelegates = [];

    // We no longer calculate occupancy live, returning an empty map
    // so that all portfolios show as 'Open' by default in the Matrix.

    // Return ONLY the completely anonymous occupation counts map and minimal stubs
    res.status(200).json({ occupiedMap: occ, stubDelegates: stubDelegates });
  } catch (error) {
    console.error("Failed to fetch occupied portfolios:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
