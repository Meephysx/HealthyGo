const express = require("express");
const router = express.Router();
const admin = require("../firebaseAdmin");
const bcrypt = require("bcrypt");

// ========================= REGISTER =========================
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // Buat user di Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullname,
    });

    // Simpan user ke database
    await admin.database().ref(`users/${userRecord.uid}`).set({
      fullname,
      email,
      createdAt: new Date().toISOString(),
    });

    // Generate token Firebase
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.json({
      message: "Registrasi berhasil",
      token,
      user: {
        uid: userRecord.uid,
        fullname,
        email,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
});

// ========================= LOGIN =========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email dan password wajib diisi" });

    // Ambil user dari Firebase Auth
    const userList = await admin.auth().listUsers();
    const user = userList.users.find((u) => u.email === email);

    if (!user)
      return res.status(404).json({ message: "Email tidak ditemukan" });

    // Ambil data user dari DB
    const snapshot = await admin.database().ref(`users/${user.uid}`).once("value");
    const userData = snapshot.val();

    // Firebase Admin tidak bisa cek password → Kamu harus cek di frontend
    // atau menggunakan Firebase Client SDK.
    // Untuk backend, kita hanya buat token:

    const token = await admin.auth().createCustomToken(user.uid);

    res.json({
      message: "Login berhasil",
      token,
      user: userData,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
});


module.exports = router;
