export default function RSVPPage() {
  return (
    <div style={{ padding: '2rem 1rem' }}>
      <section id="rsvp">
        <div className="rsvp-section">
          <h2 className="subtitle">RSVP</h2>
          <p className="rsvp-intro">
            Thank you for celebrating with us. RSVPs are now closed.
          </p>

          <form id="rsvp-form" aria-disabled="true">
            <fieldset disabled className="rsvp-form-fieldset">
              <div className="rsvp-wrapper">
                <div className="rsvp-field">
                  <label htmlFor="name" className="rsvp-label">Name</label>
                  <input type="text" id="name" name="name" className="rsvp-input" placeholder="Your name" disabled />
                </div>

                <div className="rsvp-field">
                  <label className="rsvp-label">Will you be attending?</label>
                  <div className="rsvp-radio-group">
                    <button type="button" className="rsvp-radio-btn is-disabled" disabled>
                      Yes
                    </button>
                    <button type="button" className="rsvp-radio-btn is-disabled" disabled>
                      No
                    </button>
                  </div>
                </div>

                <div className="rsvp-field">
                  <label htmlFor="guest_count" className="rsvp-label">Number of Guests</label>
                  <input
                    type="number"
                    id="guest_count"
                    name="guest_count"
                    className="rsvp-input"
                    min="1"
                    defaultValue="1"
                    disabled
                  />
                </div>

                <div className="rsvp-field">
                  <label htmlFor="message" className="rsvp-label">Message</label>
                  <textarea id="message" name="message" className="rsvp-input" rows={3} placeholder="(optional)" disabled></textarea>
                </div>

                <button type="submit" className="address-form-btn rsvp-submit-btn" disabled>
                  RSVPs Closed
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </section>
    </div>
  );
}
