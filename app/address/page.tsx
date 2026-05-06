export default function AddressPage() {
  return (
    <div className="hero">
      <p className="page-header">June 13, 2026</p>
      <p className="page-header">6:00 PM</p>
      <div className="rustic-line" style={{marginTop: '2.5rem'}}></div>
      <p className="page-header">Fall Creek Ranch</p>
      <p className="page-header">Granbury, TX</p>

      <div className="details" style={{ marginTop: '3rem', paddingBottom: '3rem' }}>
        <p className="venue words">Please provide your address to receive a formal invitation.</p>
        <div className="coming-soon" style={{ maxWidth: '520px', margin: '1rem auto' }}>
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLScNm984x3DeHwlGAWyvl4T9BGuPFoktVM2bmtDM-Hgn0ZR6og/viewform?usp=header" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="address-form-btn"
          >
            Address Form
          </a>
        </div>
      </div>
    </div>
  );
}
