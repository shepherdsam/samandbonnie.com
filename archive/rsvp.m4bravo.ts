import { createClient } from '@libsql/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RSVPData {
  name: string;
  attending: boolean;
  guest_count: number;
  message?: string;
  website?: string; // honeypot
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse and validate JSON body
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'No data received'
      });
    }

    const data: RSVPData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Validate honeypot (should be empty from real users)
    if (data.website && data.website.trim() !== '') {
      return res.status(200).json({
        success: true,
        message: 'Thank you for your submission'
      });
    }

    // Validate required fields
    const errors: Record<string, string> = {};
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.name = 'Name is required';
    }

    if (typeof data.attending !== 'boolean') {
      errors.attending = 'Attending must be a boolean';
    }

    if (
      typeof data.guest_count !== 'number' || 
      !Number.isInteger(data.guest_count) ||
      data.guest_count < 1
    ) {
      errors.guest_count = 'Guest count must be an integer greater than or equal to 1';
    }

    if (data.message && typeof data.message !== 'string') {
      errors.message = 'Message must be a string';
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Normalize data
    const validatedData: RSVPData = {
      name: data.name.trim(),
      attending: data.attending,
      guest_count: data.guest_count,
      message: data.message?.trim()
    };

    // Connect to Turso database
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!
    });

    // Insert RSVP into database
    await db.execute({
      sql: `
        INSERT INTO rsvps (name, attending, guest_count, message, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      args: [
        validatedData.name,
        validatedData.attending ? 1 : 0,
        validatedData.guest_count,
        validatedData.message
      ]
    });

    // Close database connection
    await db.close();

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'RSVP received'
    });

  } catch (error) {
    console.error('RSVP handler error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
