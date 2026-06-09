import express from "express";
import path from "path";
import dotenv from "dotenv";
import app from "./api/index";

dotenv.config();

const PORT = 3000;

// Setup Vite or static serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static build service configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running at HTTP host 0.0.0.0 on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupVite().catch((err) => {
    console.error("Failed to boot Express+Vite application:", err);
  });
}

export default app;
