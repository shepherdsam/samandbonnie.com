import { login } from './actions'

export default function AdminLogin() {
  return (
    <div className="admin-page">
      <h2>Admin Access</h2>

      <form action={login}>
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="admin-input"
        />
        <button
          type="submit"
          className="admin-btn"
        >
          SIGN IN
        </button>
      </form>
    </div>
  )
}
