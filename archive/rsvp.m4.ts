import { createClient } from '@libsql/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Parse and validate JSON body
  let data: any;
  try {
    const body = await new Promise<string>((resolve, reject) => {
      let payload = '';
      req.on('data', (chunk: Buffer) => {
        payload += chunk;
      });
      req.on('end', () => resolve(payload));
      req.on('error', reject);
    });
    data = JSON.parse(body);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const { name, attending, guest_count, message, website = '' } = data;

  // Validation errors
  const errors: Record<string, string> = {};

  if (typeof name !== 'string' || !name.trim()) {
    errors.name = 'Name is required';
  }

  if (typeof attending !== 'boolean') {
    errors.attending = 'Attending must be a boolean value';
  }

  if (typeof guest_count !== 'number' || !Number.isInteger(guest_count) || guest_count < 1) {
    errors.guest_count = 'Guest count must be an integer greater than or equal to 1';
  }

  if (website && website.toString().trim()) {
    errors.honeypot = 'Bot detected';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors });
    return;
  }

  // Database operations
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    await client.execute({
      sql: 'INSERT INTO rsvps (name, attending, guest_count, message) VALUES (?, ?, ?, ?)',
      args: [name.trim(), attending, guest_count, message?.trim() ?? null],
    });

    res.status(200).json({ success: true, message: 'RSVP received' });
  } catch (error: any) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.close();
  }
}