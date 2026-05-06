import { createClient } from "@libsql/client";

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  // Honeypot check
  if (req.body.website) {
    // Bot detected, silently succeed
    res.status(200).json({ success: true, message: "RSVP received" });
    return;
  }

  // Parse and validate body
  const { name, attending, guest_count, message } = req.body;

  const errors: Record<string, string> = {};

  // Validate name
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.name = "Name is required";
  }

  // Validate attending
  if (typeof attending !== "boolean") {
    errors.attending = "Please select whether you're attending";
  }

  // Validate guest_count
  if (typeof guest_count !== "number" || guest_count < 1 || !Number.isInteger(guest_count)) {
    errors.guest_count = "Number of guests must be at least 1";
  }

  // Validate message (optional, but if provided must be string)
  if (message !== undefined && typeof message !== "string") {
    errors.message = "Message must be a string";
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  // Get database credentials
  const databaseUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!databaseUrl || !authToken) {
    console.error("Missing Turso environment variables");
    res.status(500).json({ success: false, message: "Server configuration error" });
    return;
  }

  try {
    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    });

    await client.execute({
      sql: `INSERT INTO rsvps (name, attending, guest_count, message) VALUES (?, ?, ?, ?)`,
      args: [name.trim(), attending, guest_count, message?.trim() || null],
    });

    res.status(200).json({ success: true, message: "RSVP received" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ success: false, message: "Failed to save RSVP" });
  }
}