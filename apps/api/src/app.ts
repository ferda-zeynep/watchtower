import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { captureEvent } from "./controllers/events.controller";

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

const prisma = new PrismaClient();

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.use((req: any, _res, next) => {
  req.io = io;
  next();
});

app.post(
  "/api/events",
  (req: any, res, next) => {
    const apiKeyHeader = req.headers["x-api-key"];
    const validApiKey =
      process.env.WATCHTOWER_API_KEY || "watchtower_secret_token_123!";

    if (!apiKeyHeader || apiKeyHeader !== validApiKey) {
      console.warn(
        "⚠️ Unauthorized telemetry attempt blocked. Invalid or missing API Key.",
      );
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid or missing API Key.",
      });
    }

    next();
  },
  captureEvent,
);

// GET Route
app.get("/api/events", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { timestamp: "desc" },
    });
    res.json({ success: true, data: events });
  } catch (error: unknown) {
    console.error("GET Events error:");
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: errorMessage });
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 A dashboard connected to real-time stream: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ Dashboard disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Watchtower API Server with WebSockets running on http://localhost:${PORT}`,
  );
});
