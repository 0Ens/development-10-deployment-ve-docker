import { useState, type FormEvent } from 'react'
import { login } from '../api'

type LoginFormProps = {
  onLogin: (token: string) => void
}

function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setLoginError(null)
    try {
      const token = await login(email, password)
      onLogin(token)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Giriş yapılamadı')
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <h2>Mesaj yazmak için giriş yap</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">E-posta</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password">Şifre</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {loginError && (
          <p className="field-error" role="alert">
            {loginError}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
        </button>
      </form>
    </section>
  )
}

export default LoginForm
