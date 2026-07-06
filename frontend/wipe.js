const { config } = require('dotenv');
config({ path: '.env.local' });

const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
  };

  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function wipePortfolios() {
  console.log("Starting portfolio wipe...");
  const collections = ['delegates', 'registrations'];
  
  let totalWiped = 0;

  for (const coll of collections) {
    const snapshot = await db.collection(coll).get();
    
    const batch = db.batch();
    let batchCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.portfolio || data.portfolio_country) {
        batch.update(doc.ref, {
          portfolio: "",
          portfolio_country: ""
        });
        batchCount++;
        totalWiped++;
      }
    });

    if (batchCount > 0) {
      await batch.commit();
      console.log(`Wiped ${batchCount} portfolios in ${coll}`);
    } else {
      console.log(`No portfolios to wipe in ${coll}`);
    }
  }

  console.log(`Total portfolios unassigned: ${totalWiped}`);
  process.exit(0);
}

wipePortfolios().catch(err => {
  console.error("Wipe failed:", err);
  process.exit(1);
});
