import { db } from '../utils/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Fetch delegates and registrations securely from the backend
    const [delegatesSnap, registrationsSnap] = await Promise.all([
      db.collection("delegates").get(),
      db.collection("registrations").where("status", "==", "pending_verification").get()
    ]);

    const occ = {};
    const stubDelegates = [];

    // Calculate occupancy live
    const allDocs = [...delegatesSnap.docs, ...registrationsSnap.docs];
    
    allDocs.forEach(doc => {
      const data = doc.data();
      const port = data.portfolio || data.portfolio_country || data.portfolio_1;
      
      if (port) {
        occ[port] = (occ[port] || 0) + 1;
        // Optionally add a stub for visual indicators if needed
        stubDelegates.push({
          id: doc.id,
          committee: data.committee,
          portfolio: port,
          status: data.status || "approved"
        });
      }
    });

    // Return ONLY the completely anonymous occupation counts map and minimal stubs
    res.status(200).json({ occupiedMap: occ, stubDelegates: stubDelegates });
  } catch (error) {
    console.error("Failed to fetch occupied portfolios:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
