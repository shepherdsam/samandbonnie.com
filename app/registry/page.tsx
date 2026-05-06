export default function RegistryPage() {
  return (
    <div>
      <div className="details">
        <h2 className="subtitle">Gift Registry</h2>
        <div className="rustic-line"></div>
      </div>

      <div className="details">
        <p className="words venue">Your presence is the greatest gift, but if you wish to contribute, here is our registry:</p>

          <a 
            href="https://www.myregistry.com/giftlist/bonnieandsam" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="address-form-btn"
          >
            View Full Registry
          </a>
      </div>
      <div className="details">

        <h2 className="subtitle">Cash Gifts</h2>
        <div className="rustic-line"></div>
        
        <p className="words venue">
          Prefer to give cash? Here are our preferred options:
        </p>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.25rem', 
          maxWidth: '400px', 
          margin: '0 auto' 
        }}>
          <a 
            href="https://cash.app/$shepherdsam" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="address-form-btn"
            style={{ fontSize: '1.5rem', padding: '1rem 2.5rem' }}
          >
            CashApp • $shepherdsam
          </a>
          
          <a 
            href="https://paypal.me/shepherdsam" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="address-form-btn"
            style={{ fontSize: '1.5rem', padding: '1rem 2.5rem' }}
          >
            PayPal • @shepherdsam
          </a>
          
          <a 
            href="https://venmo.com/shepherdsam" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="address-form-btn"
            style={{ fontSize: '1.5rem', padding: '1rem 2.5rem' }}
          >
            Venmo • @shepherdsam
          </a>
          
        </div>

        <p className="words venue">
          Thank you for your generosity and for celebrating with us!
        </p>
      </div>
    </div>
  );
}
