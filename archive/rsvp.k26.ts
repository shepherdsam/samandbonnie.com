import { createClient } from '@libsql/client';

interface RSVPBody {
  name: unknown;
  attending: unknown;
  guest_count: unknown;
  message?: unknown;
  website?: unknown;
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const body = req.body as RSVPBody;

  // Honeypot: silently accept if filled (bot behavior)
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    res.status(200).json({ success: true, message: 'RSVP received' });
    return;
  }

  const errors: Record<string, string> = {};

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  if (typeof body.attending !== 'boolean') {
    errors.attending = 'Attending status is required';
  }

  const guestCount = Number(body.guest_count);
  if (!Number.isInteger(guestCount) || guestCount < 1) {
    errors.guest_count = 'Guest count must be at least 1';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Missing Turso environment variables');
    res.status(500).json({ success: false, error: 'Server configuration error' });
    return;
  }

  const client = createClient({ url, authToken });

  try {
    await client.execute({
      sql: 'INSERT INTO rsvps (name, attending, guest_count, message) VALUES (?, ?, ?, ?)',
      args: [
        String(body.name).trim(),
        Boolean(body.attending),
        guestCount,
        typeof body.message === 'string' && body.message.trim().length > 0
          ? body.message.trim()
          : null,
      ],
    });

    res.status(200).json({ success: true, message: 'RSVP received' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, error: 'Failed to save RSVP' });
  } finally {
    client.close();
  }
}
