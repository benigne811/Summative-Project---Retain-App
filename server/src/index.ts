
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Retain backend is running!",
  });
});

app.listen(PORT, () => {
  console.log(`Retain backend running at http://localhost:${PORT}`);
});
