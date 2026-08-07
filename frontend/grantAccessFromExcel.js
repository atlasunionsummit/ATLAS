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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function grantAccessFromExcel(excelFilePath) {
  if (!fs.existsSync(excelFilePath)) {
    console.error("Excel file not found at:", excelFilePath);
    process.exit(1);
  }

  console.log(`Reading Excel file: ${excelFilePath}`);
  const workbook = xlsx.readFile(excelFilePath);
  
  let grantedCount = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`Processing sheet: ${sheetName} with ${rows.length} rows`);

    for (const row of rows) {
      // Try to find the required fields
      let email = row.Email || row['Email ID'] || row['Email Address'] || row.email || row.EMAIL || row.email_id;
      let portfolio = row.Portfolio || row.Country || row.portfolio || row.PORTFOLIO || row.COUNTRY;
      let committee = row.Committee || row.committee || row.COMMITTEE || sheetName;
      let fullName = row.Name || row['Full Name'] || row['Delegate Name'] || row.name || row.NAME || "Unknown Delegate";
      let phone = row.Phone || row['Phone Number'] || row.phone || row.PHONE || "";

      if (!email) {
        console.warn("Skipping row without email:", row);
        continue;
      }
      
      if (!portfolio) {
          console.warn(`Skipping row without portfolio for email ${email}:`, row);
          continue;
      }

      const delegateId = `AUS-ADMIN-${Math.floor(10000 + Math.random() * 90000)}`;
      const delegateData = {
        id: delegateId,
        full_name: String(fullName),
        nickname: "",
        email: String(email).toLowerCase().trim(),
        phone_number: String(phone),
        country: "",
        city_of_residence: "",
        committee: String(committee),
        portfolio_country: String(portfolio),
        portfolio: String(portfolio),
        past_experience: "",
        dietary_instructions: "",
        status: "alloted",
        role: "delegate",
        is_atlas_plus: false,
        granted_by_admin: true,
        timestamp: new Date().toISOString(),
      };

      try {
        await db.collection("delegates").doc(delegateId).set(delegateData);
        // Also add an activity log
        await db.collection("activity_logs").add({
          text: `Admin granted delegate access to ${delegateData.full_name} (${delegateData.email}) from Excel`,
          timestamp: new Date().toISOString()
        });
        console.log(`Granted access to ${delegateData.email} in ${delegateData.committee} as ${delegateData.portfolio}`);
        grantedCount++;
      } catch (err) {
        console.error(`Failed to grant access to ${email}:`, err);
      }
    }
  }

  console.log(`Successfully granted access to ${grantedCount} delegates.`);
  process.exit(0);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide the path to the Excel file as an argument.");
  console.error("Usage: node grantAccessFromExcel.js <path-to-excel-file>");
  process.exit(1);
}

grantAccessFromExcel(args[0]);
