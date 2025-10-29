import express from "express";
import { showAllUsers, showUserById, addUser } from "../controllers/userControllers.js";

const router = express.Router();

router.get("/", showAllUsers);
router.get("/:id", showUserById);
router.post("/", addUser);

export default router;
