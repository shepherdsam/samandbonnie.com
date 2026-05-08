import { getDbClient, type RsvpRow } from '@/lib/db';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const client = getDbClient()

  const [attendingRes, declinedRes, listRes] = await Promise.all([
    client.execute({
      sql: 'SELECT SUM(guest_count) as total FROM rsvps WHERE attending = 1',
      args: [],
    }),
    client.execute({
      sql: 'SELECT COUNT(id) as total FROM rsvps WHERE attending = 0',
      args: [],
    }),
    client.execute({
      sql: 'SELECT * FROM rsvps ORDER BY created_at DESC',
      args: [],
    }),
  ]);

  const attending = Number(attendingRes.rows[0]?.total ?? 0);
  const declined = Number(declinedRes.rows[0]?.total ?? 0);
  const rsvps = structuredClone(listRes.rows) as unknown as RsvpRow[];

  return { attending, declined, rsvps };
}

export default async function AdminDashboard() {
  const { attending, declined, rsvps } = await getDashboardData();

  return (
    <DashboardClient attending={attending} declined={declined} rsvps={rsvps} />
  );
}
