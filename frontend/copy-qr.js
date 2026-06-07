const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\Bhupendra\\.gemini\\antigravity-ide\\brain\\a2b06aaf-0071-4993-82d0-b29a6585f396\\media__1780839444372.jpg";
const dest = path.join(__dirname, 'public', 'payment_qr.jpg');

try {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("[ATLAS PRE-START] Successfully copied payment QR code to public folder.");
  } else {
    console.warn("[ATLAS PRE-START] Source payment QR code image not found in brain artifacts.");
  }
} catch (err) {
  console.error("[ATLAS PRE-START] Error copying payment QR code:", err);
}
