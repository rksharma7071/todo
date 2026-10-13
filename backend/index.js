
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import todoRoutes from "./src/routes/todo.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/todo-app";

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Todo API is running" });
});

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
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
