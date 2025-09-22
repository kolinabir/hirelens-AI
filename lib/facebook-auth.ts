import { Page } from 'puppeteer';
import { env } from '../config/env';
import { FACEBOOK_SELECTORS } from '../config/constants';
import { scraperLogger } from './logger';
import { BrowserManager } from './browser';

export class FacebookAuth {
  private static instance: FacebookAuth;
  private isLoggedIn = false;
  private loginAttempts = 0;
  private maxLoginAttempts = 3;

  private constructor() {}

  public static getInstance(): FacebookAuth {
    if (!FacebookAuth.instance) {
      FacebookAuth.instance = new FacebookAuth();
    }
    return FacebookAuth.instance;
  }

  public async login(page: Page): Promise<boolean> {
    try {
      scraperLogger.info('🔐 Starting Facebook login process...');
      
      // Check if already logged in
      if (await this.isAlreadyLoggedIn(page)) {
        scraperLogger.info('✅ Already logged in to Facebook');
        this.isLoggedIn = true;
        return true;
      }

      // Navigate to Facebook login page
      await page.goto('https://www.facebook.com/login', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await BrowserManager.randomDelay(1000, 2000);

      // Fill email
      await page.waitForSelector(FACEBOOK_SELECTORS.login.email, { timeout: 10000 });
      await page.type(FACEBOOK_SELECTORS.login.email, env.facebookEmail, { delay: 100 });
      
      await BrowserManager.randomDelay(500, 1000);

      // Fill password
      await page.waitForSelector(FACEBOOK_SELECTORS.login.password, { timeout: 10000 });
      await page.type(FACEBOOK_SELECTORS.login.password, env.facebookPassword, { delay: 100 });
      
      await BrowserManager.randomDelay(500, 1000);

      // Click login button
      await page.click(FACEBOOK_SELECTORS.login.loginButton);

      // Wait for navigation or two-factor authentication
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        page.waitForSelector(FACEBOOK_SELECTORS.login.twoFactorCode, { timeout: 15000 }),
      ]);

      // Check for two-factor authentication
      const twoFactorElement = await page.$(FACEBOOK_SELECTORS.login.twoFactorCode);
      if (twoFactorElement) {
        scraperLogger.warn('⚠️ Two-factor authentication required. Please handle manually.');
        return false;
      }

      // Check if login was successful
      const loginSuccess = await this.verifyLoginSuccess(page);
      
      if (loginSuccess) {
        this.isLoggedIn = true;
        this.loginAttempts = 0;
        scraperLogger.info('✅ Facebook login successful');
        return true;
      } else {
        this.loginAttempts++;
        scraperLogger.error(`❌ Facebook login failed. Attempt ${this.loginAttempts}/${this.maxLoginAttempts}`);
        
        if (this.loginAttempts >= this.maxLoginAttempts) {
          scraperLogger.error('❌ Maximum login attempts reached. Account may be blocked.');
        }
        
        return false;
      }
    } catch (error) {
      this.loginAttempts++;
      scraperLogger.error('❌ Facebook login error:', error);
      return false;
    }
  }

  private async isAlreadyLoggedIn(page: Page): Promise<boolean> {
    try {
      await page.goto('https://www.facebook.com', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await BrowserManager.randomDelay(2000, 3000);

      // Check for elements that indicate logged in state
      const loggedInIndicators = [
        '[data-testid="search"]',
        '[aria-label="Account"]',
        '[data-testid="blue_bar_profile_link"]',
        'div[role="navigation"]',
      ];

      for (const selector of loggedInIndicators) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          return true;
        } catch {
          // Continue to next selector
        }
      }

      return false;
    } catch (error) {
      scraperLogger.error('❌ Error checking login status:', error);
      return false;
    }
  }

  private async verifyLoginSuccess(page: Page): Promise<boolean> {
    try {
      await BrowserManager.randomDelay(3000, 5000);

      // Check current URL
      const currentUrl = page.url();
      if (currentUrl.includes('facebook.com/login') || currentUrl.includes('checkpoint')) {
        return false;
      }

      // Check for error messages
      const errorSelectors = [
        '[data-testid="royal_login_error"]',
        '.error',
        '[role="alert"]',
      ];

      for (const selector of errorSelectors) {
        const errorElement = await page.$(selector);
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          scraperLogger.error(`❌ Login error: ${errorText}`);
          return false;
        }
      }

      // Check for successful login indicators
      const successSelectors = [
        '[data-testid="search"]',
        '[aria-label="Facebook"]',
        'div[role="navigation"]',
      ];

      for (const selector of successSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          return true;
        } catch {
          // Continue to next selector
        }
      }

      return false;
    } catch (error) {
      scraperLogger.error('❌ Error verifying login success:', error);
      return false;
    }
  }

  public async handleCheckpoint(page: Page): Promise<boolean> {
    try {
      const currentUrl = page.url();
      if (!currentUrl.includes('checkpoint')) {
        return true;
      }

      scraperLogger.warn('⚠️ Facebook checkpoint detected. Manual intervention may be required.');

      // Wait for user to handle checkpoint manually
      await BrowserManager.randomDelay(10000, 15000);

      // Check if checkpoint was resolved
      const newUrl = page.url();
      if (!newUrl.includes('checkpoint')) {
        scraperLogger.info('✅ Checkpoint resolved');
        return true;
      }

      scraperLogger.error('❌ Checkpoint not resolved. Please handle manually.');
      return false;
    } catch (error) {
      scraperLogger.error('❌ Error handling checkpoint:', error);
      return false;
    }
  }

  public async logout(page: Page): Promise<boolean> {
    try {
      scraperLogger.info('🚪 Logging out from Facebook...');
      
      // Navigate to Facebook home
      await page.goto('https://www.facebook.com', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Look for account menu
      const accountMenuSelectors = [
        '[aria-label="Account"]',
        '[data-testid="blue_bar_profile_link"]',
        'div[role="button"][tabindex="0"]',
      ];

      let accountMenu = null;
      for (const selector of accountMenuSelectors) {
        try {
          accountMenu = await page.waitForSelector(selector, { timeout: 5000 });
          if (accountMenu) break;
        } catch {
          // Continue to next selector
        }
      }

      if (!accountMenu) {
        scraperLogger.warn('⚠️ Could not find account menu for logout');
        return false;
      }

      // Click account menu
      await accountMenu.click();
      await BrowserManager.randomDelay(1000, 2000);

      // Look for logout option
      const logoutSelectors = [
        'text=Log Out',
        '[data-testid="menu_logout_button"]',
        'a[href*="logout"]',
      ];

      let logoutButton = null;
      for (const selector of logoutSelectors) {
        try {
          logoutButton = await page.waitForSelector(selector, { timeout: 5000 });
          if (logoutButton) break;
        } catch {
          // Continue to next selector
        }
      }

      if (!logoutButton) {
        scraperLogger.warn('⚠️ Could not find logout button');
        return false;
      }

      // Click logout
      await logoutButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

      this.isLoggedIn = false;
      scraperLogger.info('✅ Successfully logged out from Facebook');
      return true;
    } catch (error) {
      scraperLogger.error('❌ Error during logout:', error);
      return false;
    }
  }

  public getLoginStatus(): boolean {
    return this.isLoggedIn;
  }

  public getLoginAttempts(): number {
    return this.loginAttempts;
  }

  public canAttemptLogin(): boolean {
    return this.loginAttempts < this.maxLoginAttempts;
  }

  public resetLoginAttempts(): void {
    this.loginAttempts = 0;
  }
}

// Export singleton instance
export const facebookAuth = FacebookAuth.getInstance();