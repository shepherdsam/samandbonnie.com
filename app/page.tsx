import Link from 'next/link';

export default function Home() {
  return (
    <div className="hero">
      <p className="subsubtitle">Bonnie Fowler & Sam Shepherd</p>
      <div className="rustic-line" style={{marginTop: '2.0rem'}}></div>
      <p className="page-header">June 13, 2026</p>
      <p className="page-header">6:00 PM</p>
      <div className="rustic-line" style={{marginTop: '2.5rem'}}></div>
      <p className="page-header">Fall Creek Ranch</p>
      <p className="page-header">Granbury, TX</p>

      <div className="home-menu">
        <Link href="/rsvp" className="address-form-btn link-button">RSVP</Link>
        <Link href="/details" className="address-form-btn link-button">Details</Link>
        <Link href="/registry" className="address-form-btn link-button">Registry</Link>
      </div>
    </div>
  );
}
