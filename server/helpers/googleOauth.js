const { OAuth2Client } = require("google-auth-library");

// Inisialisasi client Google OAuth
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Fungsi untuk verifikasi token Google
async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Error verifying Google token:", error);
    throw { name: "Unauthorized", message: "Invalid Google token" };
  }
}

module.exports = { verifyGoogleToken };
