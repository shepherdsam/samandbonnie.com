'use client';

import React, { useState, useEffect } from 'react';

export default function RSVPPage() {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateGuestSection = (attendingValue: boolean | null) => {
    setIsAttending(attendingValue);
  };

  const handleAttendingChange = (value: boolean) => {
    setIsAttending(value);
    if (!value) {
      // reset guest count if no
      const guestInput = document.getElementById('guest_count') as HTMLInputElement;
      if (guestInput) {
        guestInput.value = '0';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitBtn.textContent || 'Send RSVP';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    setIsSubmitting(true);

    const formData = new FormData(form);
    const attending = formData.get('attending') === 'true';
    const guestInput = document.getElementById('guest_count') as HTMLInputElement;
    let guest_count = attending ? parseInt(guestInput?.value || '1', 10) : 0;
    if (attending && (isNaN(guest_count) || guest_count < 1)) guest_count = 1;

    const data = {
      name: formData.get('name'),
      attending,
      guest_count,
      message: formData.get('message') || '',
      website: formData.get('website') || ''
    };

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage(result.message || 'RSVP received. Thank you!');
        form.reset();
        setIsAttending(null);
      } else {
        let errorText = result.message || 'Something went wrong. Please try again.';
        if (result.errors) {
          errorText = Object.values(result.errors).join(' ');
        }
        setErrorMessage(errorText);
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again later.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      setIsSubmitting(false);
    }
  };

  // Initial guest state effect
  useEffect(() => {
    const guestInput = document.getElementById('guest_count') as HTMLInputElement;
    if (guestInput) {
      if (isAttending === false) {
        guestInput.disabled = true;
        guestInput.value = '0';
      } else if (isAttending === true) {
        guestInput.disabled = false;
        if (!guestInput.value || parseInt(guestInput.value, 10) < 1) guestInput.value = '1';
      }
    }
  }, [isAttending]);

  return (
    <div style={{ padding: '2rem 1rem' }}>
      <section id="rsvp">
        <div className="rsvp-section">
          <h2 className="subtitle">RSVP</h2>
          <p className="rsvp-intro">We can't wait to celebrate with you! Please let us know if you can join us.</p>

          <form id="rsvp-form" onSubmit={handleSubmit}>
            <div className="rsvp-wrapper">
              <div className="rsvp-field">
                <label htmlFor="name" className="rsvp-label">Name</label>
                <input type="text" id="name" name="name" className="rsvp-input" placeholder="Your name" required />
              </div>

              <div className="rsvp-field">
                <label className="rsvp-label">Will you be attending?</label>
                <div className="rsvp-radio-group">
                  <label className="rsvp-radio-btn">
                    <input 
                      type="radio" 
                      name="attending" 
                      value="true" 
                      required 
                      onChange={() => handleAttendingChange(true)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="rsvp-radio-btn">
                    <input 
                      type="radio" 
                      name="attending" 
                      value="false" 
                      required 
                      onChange={() => handleAttendingChange(false)}
                    />
                    <span>No</span>
                  </label>
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
                  required 
                />
              </div>

              <div className="rsvp-field">
                <label htmlFor="message" className="rsvp-label">Message</label>
                <textarea id="message" name="message" className="rsvp-input" rows={3} placeholder="(optional)"></textarea>
              </div>

              {/* Honeypot */}
              <input type="text" name="website" className="rsvp-honeypot" tabIndex={-1} autoComplete="off" />

              <button type="submit" className="address-form-btn rsvp-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send RSVP'}
              </button>
            </div>
          </form>

          {successMessage && (
            <div className="rsvp-message rsvp-success" style={{ display: 'block' }}>
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="rsvp-message rsvp-error" style={{ display: 'block' }}>
              {errorMessage}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
