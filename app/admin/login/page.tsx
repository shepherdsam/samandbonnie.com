'use client'

import { useEffect, useRef } from 'react'
import { login } from './actions'

export default function AdminLogin() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="admin-page">
      <h2>Admin Access</h2>

      <form action={login}>
        <input
          ref={inputRef}
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
