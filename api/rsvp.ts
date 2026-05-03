import { createClient } from "@libsql/client";

interface RSVPRequest {
  name: string;
  attending: boolean;
  guest_count: number;
  message?: string;
  website?: string; // honeypot
}

interface RSVPResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed" 
    } as RSVPResponse);
  }

  try {
    const body: RSVPRequest = req.body;

    // Honeypot check - if filled, it's a bot
    if (body.website && body.website.trim() !== "") {
      return res.status(400).json({
        success: false,
        message: "Invalid submission"
      } as RSVPResponse);
    }

    // Validation
    const errors: Record<string, string> = {};

    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      errors.name = "Name is required";
    }

    if (typeof body.attending !== "boolean") {
      errors.attending = "Attending status is required";
    }

    const guestCount = parseInt(String(body.guest_count), 10);
    if (isNaN(guestCount) || guestCount < 0 || (body.attending && guestCount < 1)) {
      errors.guest_count = body.attending
        ? "Guest count must be at least 1"
        : "Guest count must be 0 or more";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      } as RSVPResponse);
    }

    // Connect to Turso
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Insert with parameters
    await client.execute({
      sql: `
        INSERT INTO rsvps (name, attending, guest_count, message)
        VALUES (?, ?, ?, ?)
      `,
      args: [
        body.name.trim(),
        body.attending ? 1 : 0,
        guestCount,
        body.message ? body.message.trim() : null,
      ],
    });

    return res.status(200).json({
      success: true,
      message: "RSVP received. Thank you!"
    } as RSVPResponse);

  } catch (error: any) {
    console.error("RSVP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    } as RSVPResponse);
  }
}
