import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAseJWjdl-_264T6RlZjVsqRtP-71l6z-M",
  authDomain: "atlasunionsummit-9ac21.firebaseapp.com",
  projectId: "atlasunionsummit-9ac21",
  storageBucket: "atlasunionsummit-9ac21.firebasestorage.app",
  messagingSenderId: "286476979504",
  appId: "1:286476979504:web:7588da332bfe13a16c4cf5",
  measurementId: "G-TJRRN7X0KZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clear() {
  console.log("Fetching payments...");
  const snap = await getDocs(collection(db, "payments"));
  let count = 0;
  for (const document of snap.docs) {
    await deleteDoc(doc(db, "payments", document.id));
    count++;
  }
  console.log(`Deleted ${count} payment records.`);
  process.exit(0);
}

clear().catch(console.error);
