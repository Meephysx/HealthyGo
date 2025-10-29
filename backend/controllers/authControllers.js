import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, getUserByEmail } from "../models/userModel.js";

export const register = (req, res) => {
  const { name, email, password } = req.body;
  getUserByEmail(email, (err, results) => {
    if (results.length > 0) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = bcrypt.hashSync(password, 10);
    createUser({ name, email, password: hashedPassword }, (err) => {
      if (err) return res.status(500).json({ message: "DB Error" });
      res.json({ message: "User registered successfully" });
    });
  });
};

export const login = (req, res) => {
  const { email, password } = req.body;
  getUserByEmail(email, (err, results) => {
    if (results.length === 0) return res.status(400).json({ message: "User not found" });

    const user = results[0];
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ token, user });
  });
};
