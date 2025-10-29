import db from "../config/db.js";

// 🔹 Ambil semua user
export const getAllUsers = (callback) => {
  const sql = "SELECT * FROM users";
  db.query(sql, callback);
};

// 🔹 Ambil user berdasarkan ID
export const getUserById = (id, callback) => {
  const sql = "SELECT * FROM users WHERE id = ?";
  db.query(sql, [id], callback);
};

// 🔹 Ambil user berdasarkan email (👉 ini yang error kamu butuhkan!)
export const getUserByEmail = (email, callback) => {
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], callback);
};

// 🔹 Tambah user baru
export const createUser = (user, callback) => {
  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [user.name, user.email, user.password], callback);
};
