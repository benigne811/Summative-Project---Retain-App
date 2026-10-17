
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  try {
    const result = db.prepare("SELECT 1 AS connected").get() as {
      connected: number;
    };

    res.status(200).json({
      status: "ok",
      message: "Retain backend is running!",
      database: result.connected === 1 ? "connected" : "disconnected",
    });
  } catch {
    res.status(500).json({
      status: "error",
      message: "Database connection failed.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Retain backend running at http://localhost:${PORT}`);
});
