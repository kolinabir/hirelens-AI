import fs from "fs/promises";
import path from "path";
import { scraperLogger } from "./logger";
import { Protocol } from "puppeteer";

export interface BrowserSession {
  id: string;
  profilePath: string;
  fingerprint: Record<string, unknown>;
  cookies: Protocol.Network.Cookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
  isBlocked: boolean;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessionsDir: string;
  private activeSessions: Map<string, BrowserSession> = new Map();

  private constructor() {
    this.sessionsDir = path.join(process.cwd(), "browser-sessions");
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Create sessions directory if it doesn't exist
      await fs.mkdir(this.sessionsDir, { recursive: true });

      // Load existing sessions
      await this.loadExistingSessions();

      scraperLogger.info(
        `✅ Session manager initialized with ${this.activeSessions.size} sessions`
      );
    } catch (error) {
      scraperLogger.error("❌ Failed to initialize session manager:", error);
      throw error;
    }
  }

  private async loadExistingSessions(): Promise<void> {
    try {
      const sessionFiles = await fs.readdir(this.sessionsDir);

      for (const file of sessionFiles) {
        if (file.endsWith(".json")) {
          const sessionData = await fs.readFile(
            path.join(this.sessionsDir, file),
            "utf-8"
          );

          const session: BrowserSession = JSON.parse(sessionData);

          // Convert date strings back to Date objects
          session.createdAt = new Date(session.createdAt);
          session.lastUsed = new Date(session.lastUsed);

          this.activeSessions.set(session.id, session);
        }
      }
    } catch (error) {
      scraperLogger.warn("⚠️ Failed to load existing sessions:", error);
    }
  }

  public async createSession(
    fingerprint: Record<string, unknown>
  ): Promise<BrowserSession> {
    const sessionId = this.generateSessionId();
    const profilePath = path.join(this.sessionsDir, `profile_${sessionId}`);

    const session: BrowserSession = {
      id: sessionId,
      profilePath,
      fingerprint,
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0,
      isBlocked: false,
    };

    // Create profile directory
    await fs.mkdir(profilePath, { recursive: true });

    // Save session metadata
    await this.saveSession(session);

    this.activeSessions.set(sessionId, session);

    scraperLogger.info(`✅ Created new browser session: ${sessionId}`);
    return session;
  }

  public async getAvailableSession(): Promise<BrowserSession | null> {
    // Find an available session that's not blocked and hasn't been overused
    const availableSessions = Array.from(this.activeSessions.values())
      .filter((session) => !session.isBlocked && session.useCount < 50)
      .sort((a, b) => a.lastUsed.getTime() - b.lastUsed.getTime());

    if (availableSessions.length > 0) {
      const session = availableSessions[0];
      session.lastUsed = new Date();
      session.useCount++;
      await this.saveSession(session);

      scraperLogger.info(
        `♻️ Reusing browser session: ${session.id} (use count: ${session.useCount})`
      );
      return session;
    }

    return null;
  }

  public async markSessionBlocked(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isBlocked = true;
      await this.saveSession(session);

      scraperLogger.warn(`🚫 Marked session as blocked: ${sessionId}`);
    }
  }

  public async saveSessionData(
    sessionId: string,
    cookies: Protocol.Network.Cookie[],
    localStorage: Record<string, string>,
    sessionStorage: Record<string, string>
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.cookies = cookies;
      session.localStorage = localStorage;
      session.sessionStorage = sessionStorage;
      await this.saveSession(session);
    }
  }

  private async saveSession(session: BrowserSession): Promise<void> {
    try {
      const sessionFile = path.join(this.sessionsDir, `${session.id}.json`);
      await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
    } catch (error) {
      scraperLogger.error(`❌ Failed to save session ${session.id}:`, error);
    }
  }

  public async cleanupOldSessions(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sessionsToRemove: string[] = [];

    for (const [sessionId, session] of this.activeSessions) {
      if (session.lastUsed < thirtyDaysAgo || session.useCount > 100) {
        sessionsToRemove.push(sessionId);
      }
    }

    for (const sessionId of sessionsToRemove) {
      await this.removeSession(sessionId);
    }

    if (sessionsToRemove.length > 0) {
      scraperLogger.info(
        `🧹 Cleaned up ${sessionsToRemove.length} old sessions`
      );
    }
  }

  private async removeSession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        // Remove profile directory
        await fs.rm(session.profilePath, { recursive: true, force: true });

        // Remove session file
        const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
        await fs.unlink(sessionFile).catch(() => {}); // Ignore if file doesn't exist

        this.activeSessions.delete(sessionId);
      }
    } catch (error) {
      scraperLogger.error(`❌ Failed to remove session ${sessionId}:`, error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getSessionCount(): number {
    return this.activeSessions.size;
  }

  public getActiveSessionCount(): number {
    return Array.from(this.activeSessions.values()).filter(
      (session) => !session.isBlocked
    ).length;
  }

  public async getSessionStats(): Promise<{
    total: number;
    active: number;
    blocked: number;
    averageUseCount: number;
  }> {
    const sessions = Array.from(this.activeSessions.values());
    const blocked = sessions.filter((s) => s.isBlocked).length;
    const averageUseCount =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.useCount, 0) / sessions.length
        : 0;

    return {
      total: sessions.length,
      active: sessions.length - blocked,
      blocked,
      averageUseCount: Math.round(averageUseCount * 100) / 100,
    };
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
