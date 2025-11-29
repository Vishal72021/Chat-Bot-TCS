// scripts/gen-hash.js
import bcrypt from "bcrypt";

const password = "vishal-pass";

bcrypt
  .hash(password, 10)
  .then((hash) => {
    console.log("Hash for", password, "=>");
    console.log(hash);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error generating hash:", err);
    process.exit(1);
  });
