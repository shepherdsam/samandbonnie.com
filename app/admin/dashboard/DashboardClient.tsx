'use client'

import { useState, Fragment } from 'react'
import type { RsvpRow } from '@/lib/db'

interface Props {
  attending: number
  declined: number
  rsvps: RsvpRow[]
}

const parseUTCDate = (dateStr: string) => new Date(dateStr.replace(' ', 'T') + 'Z');

export default function DashboardClient({ attending, declined, rsvps }: Props) {
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'declined'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = rsvps.filter((r) => {
    const matchesName = r.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'attending' && r.attending === 1) ||
      (statusFilter === 'declined' && r.attending === 0)
    return matchesName && matchesStatus;
  })

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center mb-8">
        <h2 className="admin-heading">RSVP Dashboard</h2>
        <a href="/admin/login" className="admin-link">Sign out</a>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 p-6 admin-card">
          <div className="admin-stat-label">ATTENDING GUESTS</div>
          <div className="text-5xl mt-2">{attending}</div>
        </div>
        <div className="flex-1 p-6 admin-card">
          <div className="admin-stat-label">DECLINED GUESTS</div>
          <div className="text-5xl mt-2">{declined}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by name..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="flex-1 admin-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="admin-input"
        >
          <option value="all">All</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      <div className="text-sm mb-2" style={{color: '#5c5144'}}>
        Showing {filtered.length} of {rsvps.length} submissions
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>ATTENDING</th>
            <th>GUESTS</th>
            <th className="hidden md:table-cell">MESSAGE</th>
            <th>SUBMITTED</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center" style={{color: '#8c7b5c'}}>No matching RSVPs.</td>
            </tr>
          ) : (
            filtered.flatMap((r) => (
              <Fragment key={r.id}>
                <tr 
                  className="cursor-pointer md:cursor-default" 
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <td className="font-medium">{r.name}</td>
                  <td>{r.attending ? 'Yes' : 'No'}</td>
                  <td>{r.guest_count}</td>
                  <td className="hidden md:table-cell text-sm" style={{color: '#5c5144'}}>{r.message || '—'}</td>
                  <td className="text-sm" style={{color: '#8c7b5c'}} title={parseUTCDate(r.created_at).toLocaleTimeString('en-US')}>
                    {parseUTCDate(r.created_at).toLocaleDateString('en-US')}
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr className="md:hidden">
                    <td colSpan={5} className="p-4 text-sm" style={{color: '#5c5144'}}>
                      <strong>Message:</strong> {r.message || '—'}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
