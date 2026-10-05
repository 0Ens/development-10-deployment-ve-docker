import { useState, type FormEvent } from 'react'
import { login, register } from '../api'

type LoginFormProps = {
  onLogin: (token: string) => void
}

type Mode = 'login' | 'register'

function LoginForm({ onLogin }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setLoginError(null)
    try {
      // Kayit basariliysa ayni bilgilerle hemen giris yapiyoruz.
      if (isRegister) await register(email, password)
      const token = await login(email, password)
      onLogin(token)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Giriş yapılamadı')
      setSubmitting(false)
    }
  }

  function toggleMode() {
    setMode(isRegister ? 'login' : 'register')
    setLoginError(null)
  }

  return (
    <section className="panel">
      <h2>{isRegister ? 'Mesaj yazmak için kayıt ol' : 'Mesaj yazmak için giriş yap'}</h2>
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
          minLength={isRegister ? 8 : undefined}
          required
        />
        {loginError && (
          <p className="field-error" role="alert">
            {loginError}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Gönderiliyor...' : isRegister ? 'Kayıt ol' : 'Giriş yap'}
        </button>
      </form>
      <button type="button" className="link" onClick={toggleMode}>
        {isRegister ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}
      </button>
    </section>
  )
}

export default LoginForm
