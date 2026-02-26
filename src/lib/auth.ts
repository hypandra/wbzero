import { betterAuth } from "better-auth"
import { createPgPool } from "@/lib/postgres"

const pool = createPgPool()

export const auth = betterAuth({
  database: pool as any,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  user: {
    modelName: "wbz_user",
  },
  session: {
    modelName: "wbz_session",
    expiresIn: 60 * 60 * 24 * 7,
  },
  account: {
    modelName: "wbz_account",
  },
  verification: {
    modelName: "wbz_verification",
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "https://wbzero.com",
    "https://www.wbzero.com",
  ],
})
