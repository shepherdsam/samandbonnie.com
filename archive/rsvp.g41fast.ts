import { createClient } from '@libsql/client';

export default async function handler(req: any, res: any): Promise&lt;void&gt; {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body: string;
  try {
    body = await new Promise&lt;string&gt;((resolve, reject) =&gt; {
      let data = '';
      req.on('data', (chunk: Buffer) =&gt; {
        data += chunk;
      });
      req.on('end', () =&gt; {
        resolve(data);
      });
      req.on('error', reject);
    });
  } catch {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  let json: any;
  try {
    json = JSON.parse(body);
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const { name, attending, guest_count, message, website = '' } = json;

  const errors: Record&lt;string, string&gt; = {};

  if (typeof name !== 'string' || !name.trim()) {
    errors.name = 'Name is required';
  }

  if (typeof attending !== 'boolean') {
    errors.attending = 'Attending must be true or false';
  }

  if (typeof guest_count !== 'number' || !Number.isInteger(guest_count) || guest_count &lt; 1) {
    errors.guest_count = 'Guest count must be an integer greater than or equal to 1';
  }

  if (website &amp;&amp; website.toString().trim()) {
    errors.honeypot = 'Bot detected';
  }

  if (Object.keys(errors).length &gt; 0) {
    res.status(400).json({ errors });
    return;
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    await client.execute({
      sql: 'INSERT INTO rsvps (name, attending, guest_count, message) VALUES (?, ?, ?, ?)',
      args: [name.trim(), attending, guest_count, message || null],
    });

    res.status(200).json({ success: true, message: 'RSVP received' });
  } catch (error: any) {
    console.error('DB error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
}
