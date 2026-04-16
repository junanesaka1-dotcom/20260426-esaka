import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Shared CopilotClient — one CLI process for all connections
let sharedClient: CopilotClient | null = null;

async function getClient(): Promise<CopilotClient> {
  if (!sharedClient) {
    sharedClient = new CopilotClient();
    await sharedClient.start();
    console.log("[Copilot] Client started");
  }
  return sharedClient;
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

wss.on("connection", async (ws: WebSocket) => {
  console.log("[WS] New connection");

  let session: Awaited<ReturnType<CopilotClient["createSession"]>> | null =
    null;

  try {
    const client = await getClient();

    session = await client.createSession({
      model: "gpt-4.1",
      onPermissionRequest: approveAll,
      streaming: true,
    });
    console.log("[WS] Session created:", session.sessionId);

    // Notify client that connection is ready
    ws.send(JSON.stringify({ type: "ready" }));

    session.on("assistant.message_delta", (event) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "delta", content: event.data.deltaContent })
        );
      }
    });

    session.on("assistant.message", (event) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "message", content: event.data.content })
        );
      }
    });

    session.on("session.idle", () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "done" }));
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[WS] Setup error:", message);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "error", content: message }));
    }
    ws.close();
    return;
  }

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(String(raw));
      if (data.type === "chat" && typeof data.content === "string" && session) {
        await session.send({ prompt: data.content });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[WS] Message error:", message);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "error", content: message }));
      }
    }
  });

  ws.on("close", async () => {
    console.log("[WS] Connection closed");
    try {
      if (session) await session.disconnect();
    } catch (err) {
      console.error("[WS] Cleanup error:", err);
    }
    session = null;
  });
});

const PORT = process.env.PORT ?? 3001;

async function main() {
  // Pre-start the Copilot client so WS connections are fast
  await getClient();

  server.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("[Server] Fatal error:", err);
  process.exit(1);
});
