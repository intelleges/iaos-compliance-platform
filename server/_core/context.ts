import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  sessionUser?: any; // Simple session user from hardcoded auth
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let sessionUser: any = null;

  // Check for simple session user (hardcoded auth)
  if ((opts.req.session as any)?.user) {
    sessionUser = (opts.req.session as any).user;
  }

  // Fallback to Manus OAuth (legacy)
  if (!sessionUser) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    sessionUser,
  };
}
