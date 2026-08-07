const admin = require("firebase-admin");
const fs = require("fs");
const xlsx = require("xlsx");

// Service account key path
const serviceAccountPath = "c:\\Users\\Bhupendra\\Downloads\\atlasunionsummit-9ac21-firebase-adminsdk-fbsvc-c5496ce1f2.json";
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Firebase admin SDK key not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function eraseAndUpload(excelFilePath) {
  if (!fs.existsSync(excelFilePath)) {
    console.error("Excel file not found at:", excelFilePath);
    process.exit(1);
  }

  console.log(`Reading Excel file: ${excelFilePath}`);
  const workbook = xlsx.readFile(excelFilePath);
  const committeesSet = new Set();
  const portfoliosMap = {};

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);
    
    for (const row of rows) {
      let committeeName = row.Committee || row.committee || row.COMMITTEE || sheetName;
      let portfolioName = row.Portfolio || row.Country || row.portfolio || row.PORTFOLIO || row.COUNTRY;
      
      if (!committeeName) continue;
      
      // Normalize committee names if needed, or keep exactly as in excel
      committeeName = committeeName.trim();
      committeesSet.add(committeeName);
      
      if (!portfoliosMap[committeeName]) {
        portfoliosMap[committeeName] = [];
      }
      
      if (portfolioName) {
        portfoliosMap[committeeName].push({
          country: String(portfolioName).trim(),
          status: "Open" // Default status
        });
      }
    }
  }
  
  const committeesList = Array.from(committeesSet);
  console.log(`Found ${committeesList.length} committees.`);
  
  try {
    console.log("Erasing existing committees and portfolios in Firestore...");
    // We overwrite entirely which effectively erases the old data
    await db.collection("settings").doc("committees").set({
      list: committeesList,
      updated_at: new Date().toISOString()
    });
    
    await db.collection("settings").doc("portfolios").set({
      ...portfoliosMap,
      updated_at: new Date().toISOString()
    });
    
    console.log("Successfully erased old data and uploaded new data from Excel!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating Firestore:", error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide the path to the Excel file as an argument.");
  console.error("Usage: node uploadExcel.js <path-to-excel-file>");
  process.exit(1);
}

eraseAndUpload(args[0]);
