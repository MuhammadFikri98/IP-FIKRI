const { sign, verify } = require("jsonwebtoken");

// constants
// process.env.JWT_SECRET -> akan diload di file app.js pake package "dotenv"
// Add fallback for testing environment
const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

// console.log({ JWT_SECRET });

function signToken({ id, email }) {
  return sign({ id, email }, JWT_SECRET);
}

// verifikasi, apakah tokennya dibuat oleh server kita
// caranya gimana? jwt akan bandingin JWT_SECRET sesuai engga
function verifyToken(token) {
  return verify(token, JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
};
