import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sendgridWebhookHandler } from "../webhooks/sendgrid";
import { registerEventHandlers } from "../events/handlers";
import authRouter from "../routes/auth";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Register event handlers
  registerEventHandlers();
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Simple session configuration (no Redis needed for now)
  app.use(
    session({
      name: "iaos.sid",
      secret: process.env.SESSION_SECRET || "dev-secret-change-me-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 8, // 8 hours
      },
    })
  );
  
  // Simple auth routes (hardcoded credentials)
  app.use("/api/auth", authRouter);
  
  // Legacy Manus OAuth callback (keep for backward compatibility)
  registerOAuthRoutes(app);
  
  // SendGrid webhook endpoint
  app.post("/api/webhooks/sendgrid", sendgridWebhookHandler);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // -------------------------------
  // SPA FALLBACK FOR LIVE DEPLOYMENT
  // -------------------------------
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Serve the built client (dist/public)
  const clientDist = path.resolve(__dirname, "../..", "dist/public");

  // Fallback: any unknown route → index.html
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next(); // leave API untouched

    const indexFile = path.join(clientDist, "index.html");
    res.sendFile(indexFile, (err) => {
      if (err) {
        console.error("SPA fallback error:", err);
        res.status(500).send("Server error");
      }
    });
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
