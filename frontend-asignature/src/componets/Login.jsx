import { useState } from 'react';
import { API_URL } from '../Api';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(), // sin espacios ni mayúsculas
          password,
        }),
      });

      if (!res.ok) {
        const detalle = await res.text();
        console.error('Login falló:', res.status, detalle);

        if (res.status === 401 || res.status === 500) {
          // hoy el backend responde 500 cuando las credenciales no coinciden
          throw new Error('Correo o contraseña incorrectos');
        }
        throw new Error(`Error del servidor (${res.status})`);
      }

      const data = await res.json();

      if (!data || !data.rol) {
        throw new Error('El servidor no devolvió el rol del usuario');
      }

      onLoginSuccess(data);
    } catch (err) {
      // fetch lanza TypeError cuando no hay conexión o por CORS
      setError(
        err instanceof TypeError
          ? 'No se pudo conectar con el servidor'
          : err.message
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🎓</div>
        <h1>Quorom Académico</h1>
        <p className="subtitle">Bienvenido de nuevo, inicia sesión para continuar</p>

        {error && <p className="mensaje error">{error}</p>}

        <form onSubmit={handleLogin}>
          <label>Correo</label>
          <input
            type="email"
            placeholder="tucorreo@universidad.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
            autoComplete="email"
            required
          />
          <label>Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" disabled={cargando}>
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;