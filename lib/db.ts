import { createClient } from "@libsql/client";

export function getDbClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
}

export interface RsvpRow {
  id: number;
  name: string;
  attending: number;
  guest_count: number;
  message: string | null;
  created_at: string;
}
