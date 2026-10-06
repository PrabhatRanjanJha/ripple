import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import errorMiddleware from "./middlewares/error.middleware.js";
import userRoutes from "./routes/user.routes.js";

const app = express();
const isTest = process.argv.includes("--test");
const port = Number(process.env.PORT || 5000);
const testPort = Number(process.env.TEST_PORT || 5055);
const mongoUri = isTest
  ? process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/ripple_test"
  : process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ripple";

if (isTest) {
  if (!process.env.MONGO_URI_TEST || process.env.MONGO_URI_TEST === process.env.MONGO_URI) {
    throw new Error("MONGO_URI_TEST must be set and must differ from MONGO_URI in test mode.");
  }
}

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/users", userRoutes);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

app.use(errorMiddleware);

async function startServer() {
  try {
    await mongoose.connect(mongoUri);

    if (isTest) {
      const db = mongoose.connection.db;
      if (db) {
        await db.dropDatabase();
      }
      console.log(`Connected to test database: ${mongoUri}`);
    } else {
      console.log(`Connected to database: ${mongoUri}`);
    }

    app.listen(isTest ? testPort : port, () => {
      console.log(`Ripple server listening on ${isTest ? testPort : port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

startServer();

export default app;
