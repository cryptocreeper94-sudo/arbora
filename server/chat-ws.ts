import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { verifyToken } from "./trustlayer-sso";
import { db } from "./db";
import { chatUsers, chatMessages, chatChannels } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

interface ChatClient {
  ws: WebSocket;
  userId: string;
  username: string;
  avatarColor: string;
  role: string;
  channelId: string | null;
}

const clients = new Map<WebSocket, ChatClient>();

function broadcastToChannel(channelId: string, data: any, exclude?: WebSocket) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.channelId === channelId && client.ws !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

function getChannelUsers(channelId: string): string[] {
  const usernames: string[] = [];
  clients.forEach((client) => {
    if (client.channelId === channelId) {
      usernames.push(client.username);
    }
  });
  return [...new Set(usernames)];
}

function getOnlineCount(): number {
  const uniqueUsers = new Set<string>();
  clients.forEach((client) => uniqueUsers.add(client.userId));
  return uniqueUsers.size;
}

function buildPresence() {
  const channelUsers: Record<string, string[]> = {};
  clients.forEach((client) => {
    if (client.channelId) {
      if (!channelUsers[client.channelId]) channelUsers[client.channelId] = [];
      if (!channelUsers[client.channelId].includes(client.username)) {
        channelUsers[client.channelId].push(client.username);
      }
    }
  });
  return { type: "presence", onlineCount: getOnlineCount(), channelUsers };
}

async function sendHistory(ws: WebSocket, channelId: string) {
  const messages = await db
    .select({
      id: chatMessages.id,
      channelId: chatMessages.channelId,
      userId: chatMessages.userId,
      content: chatMessages.content,
      replyToId: chatMessages.replyToId,
      createdAt: chatMessages.createdAt,
      username: chatUsers.username,
      avatarColor: chatUsers.avatarColor,
      role: chatUsers.role,
    })
    .from(chatMessages)
    .innerJoin(chatUsers, eq(chatMessages.userId, chatUsers.id))
    .where(eq(chatMessages.channelId, channelId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(50);

  ws.send(JSON.stringify({ type: "history", messages: messages.reverse() }));
}

export function setupChatWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", async (rawData: Buffer) => {
      try {
        const data = JSON.parse(rawData.toString());

        if (data.type === "join") {
          const decoded = verifyToken(data.token);
          if (!decoded) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
            ws.close();
            return;
          }

          const [user] = await db.select().from(chatUsers).where(eq(chatUsers.id, decoded.userId)).limit(1);
          if (!user) {
            ws.send(JSON.stringify({ type: "error", message: "User not found" }));
            ws.close();
            return;
          }

          const channelId = data.channelId;
          const [channel] = await db.select().from(chatChannels).where(eq(chatChannels.id, channelId)).limit(1);
          if (!channel) {
            ws.send(JSON.stringify({ type: "error", message: "Channel not found" }));
            return;
          }

          clients.set(ws, {
            ws,
            userId: user.id,
            username: user.username,
            avatarColor: user.avatarColor,
            role: user.role,
            channelId,
          });

          await db.update(chatUsers).set({ isOnline: true, lastSeen: new Date() }).where(eq(chatUsers.id, user.id));
          await sendHistory(ws, channelId);

          broadcastToChannel(channelId, {
            type: "user_joined",
            userId: user.id,
            username: user.username,
          }, ws);

          clients.forEach((c) => {
            if (c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(JSON.stringify(buildPresence()));
            }
          });
        }

        if (data.type === "switch_channel") {
          const client = clients.get(ws);
          if (!client) return;

          const oldChannelId = client.channelId;
          const newChannelId = data.channelId;

          const [channel] = await db.select().from(chatChannels).where(eq(chatChannels.id, newChannelId)).limit(1);
          if (!channel) {
            ws.send(JSON.stringify({ type: "error", message: "Channel not found" }));
            return;
          }

          if (oldChannelId) {
            broadcastToChannel(oldChannelId, {
              type: "user_left",
              userId: client.userId,
              username: client.username,
            }, ws);
          }

          client.channelId = newChannelId;
          await sendHistory(ws, newChannelId);

          broadcastToChannel(newChannelId, {
            type: "user_joined",
            userId: client.userId,
            username: client.username,
          }, ws);

          clients.forEach((c) => {
            if (c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(JSON.stringify(buildPresence()));
            }
          });
        }

        if (data.type === "message") {
          const client = clients.get(ws);
          if (!client || !client.channelId) return;

          let content = (data.content || "").trim();
          if (!content || content.length > 2000) return;

          const [msg] = await db.insert(chatMessages).values({
            channelId: client.channelId,
            userId: client.userId,
            content,
            replyToId: data.replyToId || null,
          }).returning();

          broadcastToChannel(client.channelId, {
            type: "message",
            id: msg.id,
            channelId: msg.channelId,
            userId: client.userId,
            username: client.username,
            avatarColor: client.avatarColor,
            role: client.role,
            content: msg.content,
            replyToId: msg.replyToId,
            createdAt: msg.createdAt,
          });
        }

        if (data.type === "typing") {
          const client = clients.get(ws);
          if (!client || !client.channelId) return;

          broadcastToChannel(client.channelId, {
            type: "typing",
            userId: client.userId,
            username: client.username,
          }, ws);
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    ws.on("close", async () => {
      const client = clients.get(ws);
      if (client) {
        if (client.channelId) {
          broadcastToChannel(client.channelId, {
            type: "user_left",
            userId: client.userId,
            username: client.username,
          });
        }

        const hasOtherConnections = Array.from(clients.values()).some(
          (c) => c.userId === client.userId && c.ws !== ws
        );
        if (!hasOtherConnections) {
          await db.update(chatUsers).set({ isOnline: false, lastSeen: new Date() }).where(eq(chatUsers.id, client.userId));
        }

        clients.delete(ws);

        clients.forEach((c) => {
          if (c.ws.readyState === WebSocket.OPEN) {
            c.ws.send(JSON.stringify(buildPresence()));
          }
        });
      }
    });
  });

  return wss;
}
