import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db.js";
import { deviceAuthorization } from "better-auth/plugins"; 

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: ["http://localhost:3000"],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    deviceAuthorization({ 
      verificationUri: "/device", 
      expiresIn: "30m",
      interval: "5s",
      schema: {}
    }), 
  ],
});

// basePath: This is typically the path where the Better Auth routes are mounted. It will be overridden if there is a path component within baseURL.
// (Default: /api/auth)