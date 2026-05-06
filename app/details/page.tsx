export default function DetailsPage() {
  return (
    <div>

      <div className="details">
        <h2 className="subtitle">Venue</h2>
        <div className="rustic-line"></div>
        <p className="venue">Fall Creek Ranch</p>
        <p className="venue" style={{ marginTop: '.5rem'}}>
          8220 Langdon Leake Ct<br />
          Granbury, Texas 76049
        </p>
      </div>

      <div className="details">
        <h2 className="subtitle">Accommodations</h2>
        <div className="rustic-line"></div>
        <p className="venue">Click below for lodging options in Grandbury.</p>

          <a 
            href="https://www.visitgranbury.com/places-to-stay/"
            target="_blank" 
            rel="noopener noreferrer" 
            className="address-form-btn link-button" 
          >
            Lodging
          </a>

        </div>
      </div>
  );
}
