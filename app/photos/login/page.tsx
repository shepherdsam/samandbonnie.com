import { loginPhotos } from './actions';
import { safePhotosNext } from '@/lib/photos-auth';

export default async function PhotosLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safePhotosNext(params.next);
  const showError = params.error === '1';

  return (
    <div className="details">
      <h2 className="subtitle">Photos</h2>
      <div className="rustic-line"></div>
      <p className="words venue">Enter the gallery password to view our wedding photos.</p>

      <form action={loginPhotos} className="photos-login-form">
        <input type="hidden" name="next" value={next} />
        <label className="rsvp-label" htmlFor="photos-password">Password</label>
        <input
          id="photos-password"
          type="password"
          name="password"
          required
          autoFocus
          className="rsvp-input"
        />
        <button type="submit" className="address-form-btn photos-login-btn">
          View Photos
        </button>
        {showError ? (
          <p className="photos-login-error" role="alert">That password is not correct.</p>
        ) : null}
      </form>
    </div>
  );
}
