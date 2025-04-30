const { User } = require("../models");
const { signToken } = require("../helpers/jwt");
const { comparePassword } = require("../helpers/bcrypt");
const { verifyGoogleToken } = require("../helpers/googleOauth");

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password } = req.body;
      const newUser = await User.create({ email, password });

      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) {
        throw { name: "BadRequest", message: "Email is required" };
      }

      if (!password) {
        throw { name: "BadRequest", message: "Password is required" };
      }

      const user = await User.findOne({ where: { email } });

      if (!user || !comparePassword(password, user.password)) {
        throw { name: "Unauthorized", message: "Invalid email/password" };
      }

      const access_token = signToken({
        id: user.id,
        email: user.email,
      });

      res.status(200).json({ access_token: access_token });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        throw { name: "BadRequest", message: "Google token is required" };
      }

      // Verifikasi token Google
      const userData = await verifyGoogleToken(token);

      // Cari user berdasarkan email
      let user = await User.findOne({ where: { email: userData.email } });

      // Jika user belum terdaftar, buat user baru
      if (!user) {
        // Generate random password untuk user baru
        const randomPassword = Math.random().toString(36).slice(-8);

        user = await User.create({
          email: userData.email,
          password: randomPassword, // Akan di-hash oleh hook di model
        });
      }

      // Generate access token
      const access_token = signToken({
        id: user.id,
        email: user.email,
      });

      res.status(200).json({ access_token });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
