import { Page } from "puppeteer";
import { scraperLogger } from "./logger";
import { BrowserManager } from "./browser";
import { facebookAuth } from "./facebook-auth";

export interface GroupInfo {
  groupId: string;
  name: string;
  url: string;
  memberCount?: number;
  description?: string;
  isPrivate: boolean;
  canAccess: boolean;
}

export class FacebookGroupNavigator {
  private static instance: FacebookGroupNavigator;

  private constructor() {}

  public static getInstance(): FacebookGroupNavigator {
    if (!FacebookGroupNavigator.instance) {
      FacebookGroupNavigator.instance = new FacebookGroupNavigator();
    }
    return FacebookGroupNavigator.instance;
  }

  public async navigateToGroup(
    page: Page,
    groupUrl: string
  ): Promise<GroupInfo | null> {
    try {
      scraperLogger.info(`🔗 Navigating to group: ${groupUrl}`);

      // Ensure we're logged in
      if (!facebookAuth.getLoginStatus()) {
        const loginSuccess = await facebookAuth.login(page);
        if (!loginSuccess) {
          throw new Error("Facebook login required to access groups");
        }
      }

      // Navigate to the group
      await page.goto(groupUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      await BrowserManager.randomDelay(2000, 4000);

      // Check if the group is accessible
      const groupInfo = await this.extractGroupInfo(page, groupUrl);

      if (!groupInfo.canAccess) {
        scraperLogger.warn(`⚠️ Cannot access group: ${groupUrl}`);
        return groupInfo;
      }

      // Check if we need to join the group
      const needsToJoin = await this.checkNeedsToJoin(page);
      if (needsToJoin) {
        const joinSuccess = await this.attemptToJoinGroup(page);
        if (!joinSuccess) {
          scraperLogger.warn(`⚠️ Could not join group: ${groupUrl}`);
          groupInfo.canAccess = false;
          return groupInfo;
        }
      }

      // Navigate to the group's posts feed
      await this.navigateToPostsFeed(page);

      scraperLogger.info(
        `✅ Successfully navigated to group: ${groupInfo.name}`
      );
      return groupInfo;
    } catch (error) {
      scraperLogger.error(`❌ Error navigating to group ${groupUrl}:`, error);
      return null;
    }
  }

  private async extractGroupInfo(
    page: Page,
    groupUrl: string
  ): Promise<GroupInfo> {
    try {
      // Extract group ID from URL
      const groupId = this.extractGroupIdFromUrl(groupUrl);

      // Initialize group info
      const groupInfo: GroupInfo = {
        groupId,
        name: "Unknown Group",
        url: groupUrl,
        isPrivate: false,
        canAccess: true,
      };

      // Check for access denied or private group indicators
      const restrictedSelectors = [
        "text=This content isn't available right now",
        "text=You can't access this group",
        "text=This group is private",
        "text=Join Group",
        '[data-testid="group_mall_privacy_notice"]',
      ];

      for (const selector of restrictedSelectors) {
        try {
          const element = await page.waitForSelector(selector, {
            timeout: 3000,
          });
          if (element) {
            groupInfo.canAccess = false;
            if (
              selector.includes("private") ||
              selector.includes("Join Group")
            ) {
              groupInfo.isPrivate = true;
            }
            break;
          }
        } catch {
          // Continue checking other selectors
        }
      }

      // Extract group name
      const nameSelectors = [
        'h1[data-testid="group_name"]',
        "h1",
        '[data-testid="group_name"]',
        "title",
      ];

      for (const selector of nameSelectors) {
        try {
          const nameElement = await page.$(selector);
          if (nameElement) {
            const name = await page.evaluate(
              (el) => el.textContent?.trim(),
              nameElement
            );
            if (name && name.length > 0) {
              groupInfo.name = name;
              break;
            }
          }
        } catch {
          // Continue to next selector
        }
      }

      // Extract member count
      try {
        const memberSelectors = [
          "text=/\\d+[KM]? members/",
          '[data-testid="group_member_count"]',
          "text=/\\d+ members/",
        ];

        for (const selector of memberSelectors) {
          try {
            const memberElement = await page.$(selector);
            if (memberElement) {
              const memberText = await page.evaluate(
                (el) => el.textContent,
                memberElement
              );
              const memberCount = this.parseMemberCount(memberText);
              if (memberCount > 0) {
                groupInfo.memberCount = memberCount;
                break;
              }
            }
          } catch {
            // Continue to next selector
          }
        }
      } catch (error) {
        // Member count is optional
        scraperLogger.debug("Could not extract member count:", error);
      }

      // Extract description
      try {
        const descriptionSelectors = [
          '[data-testid="group_description"]',
          'span[dir="auto"]',
          ".group_description",
        ];

        for (const selector of descriptionSelectors) {
          try {
            const descElement = await page.$(selector);
            if (descElement) {
              const description = await page.evaluate(
                (el) => el.textContent?.trim(),
                descElement
              );
              if (description && description.length > 10) {
                groupInfo.description = description.slice(0, 500); // Limit description length
                break;
              }
            }
          } catch {
            // Continue to next selector
          }
        }
      } catch (error) {
        // Description is optional
        scraperLogger.debug("Could not extract description:", error);
      }

      return groupInfo;
    } catch (error) {
      scraperLogger.error("Error extracting group info:", error);
      return {
        groupId: this.extractGroupIdFromUrl(groupUrl),
        name: "Unknown Group",
        url: groupUrl,
        isPrivate: false,
        canAccess: false,
      };
    }
  }

  private extractGroupIdFromUrl(url: string): string {
    // Extract group ID from various Facebook group URL formats
    const patterns = [/groups\/(\d+)/, /groups\/([^\/\?]+)/, /\/([^\/]+)\/\?/];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Fallback: use the URL as ID
    return url.replace(/[^\w]/g, "_");
  }

  private parseMemberCount(text: string | null): number {
    if (!text) return 0;

    const match = text.match(/(\d+(?:\.\d+)?)\s*([KM]?)/i);
    if (!match) return 0;

    let count = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    if (unit === "K") {
      count *= 1000;
    } else if (unit === "M") {
      count *= 1000000;
    }

    return Math.floor(count);
  }

  private async checkNeedsToJoin(page: Page): Promise<boolean> {
    const joinSelectors = [
      "text=Join Group",
      '[data-testid="join_group_button"]',
      'button[aria-label*="Join"]',
    ];

    for (const selector of joinSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 3000 });
        if (element) {
          return true;
        }
      } catch {
        // Continue checking other selectors
      }
    }

    return false;
  }

  private async attemptToJoinGroup(page: Page): Promise<boolean> {
    try {
      scraperLogger.info("🤝 Attempting to join group...");

      const joinSelectors = [
        "text=Join Group",
        '[data-testid="join_group_button"]',
        'button[aria-label*="Join"]',
      ];

      let joinButton = null;
      for (const selector of joinSelectors) {
        try {
          joinButton = await page.waitForSelector(selector, { timeout: 5000 });
          if (joinButton) break;
        } catch {
          // Continue to next selector
        }
      }

      if (!joinButton) {
        scraperLogger.warn("⚠️ Could not find join button");
        return false;
      }

      // Click join button
      await joinButton.click();
      await BrowserManager.randomDelay(2000, 4000);

      // Check if join was successful or if approval is needed
      const approvalSelectors = [
        "text=Request Sent",
        "text=Pending",
        "text=Your request to join",
      ];

      for (const selector of approvalSelectors) {
        try {
          const element = await page.waitForSelector(selector, {
            timeout: 5000,
          });
          if (element) {
            scraperLogger.info("✅ Join request sent, waiting for approval");
            return false; // Can't access yet, need approval
          }
        } catch {
          // Continue checking
        }
      }

      // Check if we can now access the group
      await BrowserManager.randomDelay(2000, 3000);
      const canAccess = await this.verifyGroupAccess(page);

      if (canAccess) {
        scraperLogger.info("✅ Successfully joined group");
        return true;
      } else {
        scraperLogger.warn(
          "⚠️ Join attempt unclear, group may require approval"
        );
        return false;
      }
    } catch (error) {
      scraperLogger.error("❌ Error attempting to join group:", error);
      return false;
    }
  }

  private async verifyGroupAccess(page: Page): Promise<boolean> {
    try {
      // Look for elements that indicate successful access to group content
      const accessSelectors = [
        '[data-testid="group_feed"]',
        '[role="main"]',
        'div[data-pagelet="GroupFeed"]',
        "article",
      ];

      for (const selector of accessSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          return true;
        } catch {
          // Continue checking other selectors
        }
      }

      return false;
    } catch (error) {
      scraperLogger.error("Error verifying group access:", error);
      return false;
    }
  }

  private async navigateToPostsFeed(page: Page): Promise<void> {
    try {
      // Look for and click on "Posts" or "Discussion" tab
      const feedSelectors = [
        "text=Posts",
        "text=Discussion",
        '[data-testid="group_discussion_tab"]',
        'a[href*="posts"]',
      ];

      for (const selector of feedSelectors) {
        try {
          const element = await page.waitForSelector(selector, {
            timeout: 5000,
          });
          if (element) {
            await element.click();
            await BrowserManager.randomDelay(2000, 3000);
            break;
          }
        } catch {
          // Continue to next selector
        }
      }

      // Wait for posts to load
      await page.waitForSelector('[role="main"]', { timeout: 10000 });
      scraperLogger.info("✅ Navigated to posts feed");
    } catch {
      scraperLogger.warn(
        "⚠️ Could not navigate to posts feed, continuing anyway"
      );
    }
  }

  public async validateGroupUrls(
    urls: string[]
  ): Promise<{ valid: string[]; invalid: string[] }> {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const url of urls) {
      if (this.isValidFacebookGroupUrl(url)) {
        valid.push(url);
      } else {
        invalid.push(url);
      }
    }

    return { valid, invalid };
  }

  private isValidFacebookGroupUrl(url: string): boolean {
    const facebookGroupPatterns = [
      /^https?:\/\/(www\.)?facebook\.com\/groups\/[^\/\s]+/,
      /^https?:\/\/(www\.)?facebook\.com\/[^\/\s]+\/\?ref=group/,
    ];

    return facebookGroupPatterns.some((pattern) => pattern.test(url));
  }
}

// Export singleton instance
export const groupNavigator = FacebookGroupNavigator.getInstance();
