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
        <p className="words venue">
          Thank you for your generosity and for celebrating with us!
        </p>
      </div>
    </div>
  );
}
