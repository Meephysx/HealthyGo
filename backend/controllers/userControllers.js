// Import fungsi dari model
import { getAllUsers, getUserById, createUser } from "../models/UserModel.js";

// ✅ Ambil semua user
export const showAllUsers = (req, res) => {
  getAllUsers((err, results) => {
    if (err) {
      console.error("❌ Error fetching users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    } else {
      res.status(200).json(results);
    }
  });
};

// ✅ Ambil user berdasarkan ID
export const showUserById = (req, res) => {
  const { id } = req.params;
  getUserById(id, (err, results) => {
    if (err) {
      console.error("❌ Error fetching user:", err);
      res.status(500).json({ error: "Database error" });
    } else if (results.length === 0) {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(200).json(results[0]);
    }
  });
};

// ✅ Tambahkan user baru
export const addUser = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  createUser({ name, email, password }, (err, result) => {
    if (err) {
      console.error("❌ Error creating user:", err);
      res.status(500).json({ error: "Failed to create user" });
    } else {
      res.status(201).json({ message: "✅ User created successfully" });
    }
  });
};
