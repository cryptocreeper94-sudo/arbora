import { db } from "./db";
import { chatChannels, chatUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const CHANNELS = [
  { name: "general", description: "General discussion for the DarkWave ecosystem", category: "ecosystem", isDefault: true },
  { name: "announcements", description: "Official announcements and updates", category: "ecosystem", isDefault: false },
  { name: "darkwavestudios-support", description: "Support for DarkWave Studios", category: "app-support", isDefault: false },
  { name: "garagebot-support", description: "Support for GarageBot.io", category: "app-support", isDefault: false },
  { name: "tlid-marketing", description: "TLID marketing discussions", category: "app-support", isDefault: false },
  { name: "guardian-ai", description: "Guardian AI discussions", category: "app-support", isDefault: false },
  { name: "verdara-support", description: "Support for Verdara outdoor recreation", category: "app-support", isDefault: false },
  { name: "vedasolus-wellness", description: "VedaSolus holistic wellness hub", category: "app-support", isDefault: false },
];

export async function seedChatData() {
  try {
    for (const channel of CHANNELS) {
      const [existing] = await db.select().from(chatChannels).where(eq(chatChannels.name, channel.name)).limit(1);
      if (!existing) {
        await db.insert(chatChannels).values(channel);
        console.log(`[chat-seed] Created channel: #${channel.name}`);
      }
    }

    const [botUser] = await db.select().from(chatUsers).where(eq(chatUsers.username, "signal-bot")).limit(1);
    if (!botUser) {
      const hash = await bcrypt.hash("BotPass!2026SecureX", 12);
      await db.insert(chatUsers).values({
        username: "signal-bot",
        email: "bot@darkwavestudios.com",
        passwordHash: hash,
        displayName: "Signal Bot",
        avatarColor: "#10b981",
        role: "bot",
        trustLayerId: "tl-system-signalbot",
        isOnline: true,
      });
      console.log("[chat-seed] Created Signal Bot user");
    }

    console.log("[chat-seed] Chat seeding complete");
  } catch (error) {
    console.error("[chat-seed] Error seeding chat data:", error);
  }
}
