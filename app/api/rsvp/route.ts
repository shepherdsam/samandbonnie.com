import { createClient } from "@libsql/client";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    const body: RSVPRequest = await req.json();

    // Honeypot check - if filled, it's a bot
    if (body.website && body.website.trim() !== "") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid submission",
        } as RSVPResponse,
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        } as RSVPResponse,
        { status: 400 }
      );
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

    return NextResponse.json(
      {
        success: true,
        message: "RSVP received. Thank you!",
      } as RSVPResponse,
      { status: 200 }
    );
  } catch (error: any) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Please try again later.",
      } as RSVPResponse,
      { status: 500 }
    );
  }
}
