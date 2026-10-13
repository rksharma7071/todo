
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import todoRoutes from "./src/routes/todo.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/todo-app";

// Trust first proxy (Required for Render, Heroku, etc. behind reverse proxies)
app.set("trust proxy", 1);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((item) => item.trim())
      : "*",
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "10kb" }));

// Rate limiter - protects against abusive spikes
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check endpoint (Used by Render for zero-downtime deploys)
app.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "healthy" : "unhealthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: isDbConnected ? "connected" : "disconnected",
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Todo API is running" });
});

// API Routes
app.use("/api/todos", todoRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// Connect MongoDB and start server
let server;

mongoose
  .connect(MONGODB_URI, {
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE, 10) || 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("MongoDB connected");

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });

// Graceful shutdown handlers for Render/containers
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await mongoose.connection.close(false);
        console.log("MongoDB connection closed.");
        process.exit(0);
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }

  // Force shutdown if connections do not close in 10s
  setTimeout(() => {
    console.error("Forceful shutdown due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

