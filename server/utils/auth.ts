/**
 * @file Better Auth server configuration
 * @description Main Better Auth configuration with Drizzle adapter and magic link
 *
 * This configuration:
 * - Uses SQLite via Drizzle ORM for auth data storage
 * - Enables magic link authentication via Resend
 * - Ensures user profile exists on login (SQL-backed)
 * - Handles same-origin auth (no cross-domain cookie issues)
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
import { db } from "../database";
import { user as userTable, profile as profileTable } from "../database/schema";
import { isAdminEmail } from "@/app/config/auth";

/**
 * Get the site URL for Better Auth
 * Uses environment variable in production, defaults to localhost in dev
 *
 * NOTE: We hardcode localhost:3000 for development because the env var
 * may not resolve correctly during server-side initialization
 */
const getSiteUrl = () => {
  // In production, use the NUXT_PUBLIC_SITE_URL
  // In dev, always use localhost:3000 (the Nuxt app)
  return process.env.NODE_ENV === "production"
    ? process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000"
    : "http://localhost:3000";
};

/**
 * Send magic link email via Resend
 * Reuses the same email template from the previous implementation
 *
 * In development, if email sending fails (e.g., Resend test domain limitation),
 * the magic link URL is logged to console for manual testing.
 */
async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const isDev = process.env.NODE_ENV !== "production";

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not configured");
    if (isDev) {
      console.log(
        "\n╔══════════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║  DEV MODE: Magic Link (copy to browser to sign in)           ║",
      );
      console.log(
        "╠══════════════════════════════════════════════════════════════╣",
      );
      console.log(`║  Email: ${email}`);
      console.log(`║  URL: ${url}`);
      console.log(
        "╚══════════════════════════════════════════════════════════════╝\n",
      );
      return; // Don't throw in dev mode
    }
    throw new Error("Email service not configured");
  }

  console.log("Sending magic link email to:", email);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Use Resend's test domain for development, or verified domain in production
      from: "military.contractors <onboarding@resend.dev>",
      to: email,
      subject: "Sign in to military.contractors",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sign in to military.contractors</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #e5e5e5; padding: 40px 20px; margin: 0;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #171717; border: 1px solid #262626; padding: 32px;">
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 24px 0;">
                Sign in to military.contractors
              </h1>
              <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                Click the button below to securely sign in. This link expires in 15 minutes.
              </p>
              <a href="${url}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 24px; margin-bottom: 24px;">
                Sign in
              </a>
              <p style="color: #737373; font-size: 12px; line-height: 1.6; margin: 0 0 16px 0;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="color: #525252; font-size: 11px; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:
                <br>
                <a href="${url}" style="color: #3b82f6; word-break: break-all;">${url}</a>
              </p>
            </div>
          </body>
        </html>
      `,
      text: `Sign in to military.contractors\n\nClick this link to sign in: ${url}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this email, you can safely ignore it.`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "Failed to send magic link email. Status:",
      response.status,
      "Body:",
      errorText,
    );

    // In dev mode, log the magic link so testing can continue
    if (isDev) {
      console.log(
        "\n╔══════════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║  DEV MODE: Email failed, use this link to sign in            ║",
      );
      console.log(
        "╠══════════════════════════════════════════════════════════════╣",
      );
      console.log(`║  Email: ${email}`);
      console.log(`║  URL: ${url}`);
      console.log(
        "╚══════════════════════════════════════════════════════════════╝\n",
      );
      return; // Don't throw in dev mode - allow testing via console link
    }

    throw new Error(`Failed to send email: ${errorText}`);
  }

  const result = await response.json();
  console.log("Magic link email sent successfully. ID:", result.id);
}

/**
 * Update user login metadata in Better Auth database
 * Called after successful authentication
 *
 * Updates:
 * - lastLoginAt: Current timestamp
 * - isAdmin: Based on admin email whitelist
 * - role: 'admin' or 'user' based on email
 */
async function updateUserOnLogin(userId: string, email: string): Promise<void> {
  try {
    const shouldBeAdmin = isAdminEmail(email);
    await db
      .update(userTable)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
        isAdmin: shouldBeAdmin,
        role: shouldBeAdmin ? "admin" : "user",
      })
      .where(eq(userTable.id, userId));

    if (shouldBeAdmin) {
      console.log(`Admin status set for ${email}`);
    }
  } catch (error) {
    console.error("Failed to update user on login:", error);
  }
}

/**
 * Ensure user has a profile record
 * Called after successful authentication to maintain user profile data
 *
 * This creates a profile record if one doesn't exist, allowing
 * users to set their preferences (branch, MOS, clearance, etc.)
 */
async function ensureUserProfile(userId: string): Promise<void> {
  try {
    // Check if profile exists
    const existingProfile = await db.query.profile.findFirst({
      where: eq(profileTable.userId, userId),
    });

    if (!existingProfile) {
      // Create empty profile for the user
      await db.insert(profileTable).values({
        userId,
      });
      console.log("Created profile for user:", userId);
    }
  } catch (error) {
    // Log but don't fail auth if profile creation fails
    // The user can still authenticate; profile can be created later
    console.error("Failed to ensure user profile:", error);
  }
}

/**
 * Better Auth instance
 *
 * Configuration:
 * - Database: SQLite via Drizzle adapter
 * - Auth methods: Magic link only (no password)
 * - User fields: Extended with role and isAdmin
 * - Hooks: Ensure profile exists after magic link verification
 */
export const auth = betterAuth({
  // Database configuration
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),

  // Secret for encryption/signing (reads from BETTER_AUTH_SECRET env var)
  // Generate with: openssl rand -base64 32
  secret: process.env.BETTER_AUTH_SECRET,

  // Base URL for auth routes and redirects
  baseURL: getSiteUrl(),

  // Disable email/password auth - magic link only
  emailAndPassword: {
    enabled: false,
  },

  // Plugins
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
      // Token expires in 15 minutes
      expiresIn: 60 * 15,
    }),
  ],

  // Trusted origins for redirects
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.NUXT_PUBLIC_SITE_URL || "",
  ].filter(Boolean),

  // User model configuration
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Don't allow setting via API
      },
      isAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // Don't allow setting via API
      },
    },
  },

  // Session configuration
  session: {
    // Session expires in 30 days
    expiresIn: 60 * 60 * 24 * 30,
    // Update session expiry on each request
    updateAge: 60 * 60 * 24, // Update once per day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache for 5 minutes
    },
  },

  // Advanced configuration
  advanced: {
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // Lifecycle hooks
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Handle post-authentication tasks after magic link verification
      // Better Auth uses /magic-link/verify path
      if (ctx.path === "/magic-link/verify") {
        // Only process if login was successful and we have a session
        const newSession = ctx.context.newSession;
        if (newSession?.user) {
          const user = newSession.user;

          // Update login metadata and admin status in Better Auth database
          await updateUserOnLogin(user.id, user.email);

          // Ensure user has a profile record
          await ensureUserProfile(user.id);
        }
      }
    }),
  },
});

// Export auth type for use in client
export type Auth = typeof auth;
