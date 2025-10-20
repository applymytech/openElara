// Loads build/signing-keys.env if present and exports variables into process.env
// This script is intentionally tolerant: if the file is missing it exits 0.
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'signing-keys.env');
if (!fs.existsSync(envPath)) {
  // No signing file provided (optional)
  process.exit(0);
}

const content = fs.readFileSync(envPath, 'utf8');
content.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^#=\s]+)=(.*)$/);
  if (m) {
    const key = m[1];
    let val = m[2] || '';
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
});

// Done. Keep process alive until electron-builder reads env vars.
// Exit successfully.
process.exit(0);
