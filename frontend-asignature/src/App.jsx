import { useState } from 'react';
import Login from './componets/Login';
import Dashboard from './componets/Dashboard';
import DirectorView from './componets/DirectorView';
import './App.css';

// Qué vistas puede ver cada rol (la primera es la que se abre al entrar)
const VISTAS_POR_ROL = {
  ESTUDIANTE: ['dashboard', 'perfil'],
  DIRECTOR: ['director', 'perfil'],
};

const NAV_ITEMS = {
  dashboard: '🏠 Mis Solicitudes',
  director: '📊 Vista del Director',
  perfil: '👤 Perfil',
};

function iniciales(nombre) {
  return nombre.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function App() {
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('usuario');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });
  const [vista, setVista] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLoginSuccess = (data) => {
    setUsuario(data);
    setVista(''); // se resetea para que abra la vista inicial del rol
    localStorage.setItem('usuario', JSON.stringify(data));
  };

  const handleLogout = () => {
    setUsuario(null);
    setVista('');
    localStorage.removeItem('usuario');
  };

  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
    setMenuAbierto(false);
  };

  if (!usuario) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const vistasPermitidas = VISTAS_POR_ROL[usuario.rol] ?? ['perfil'];
  // Si la vista guardada no está permitida para este rol, usa la primera permitida
  const vistaActual = vistasPermitidas.includes(vista) ? vista : vistasPermitidas[0];

  return (
    <div className="app-layout">
      {menuAbierto && <div className="overlay" onClick={() => setMenuAbierto(false)} />}

      <aside className={menuAbierto ? 'sidebar abierto' : 'sidebar'}>
        <div className="sidebar-logo">
          <span className="logo-icon">🎓</span>
          <div>
            <strong>Quorom</strong>
            <p>Solicitud de asignaturas</p>
          </div>
          <button className="btn-cerrar-menu" onClick={() => setMenuAbierto(false)}>✕</button>
        </div>

        <nav>
          {vistasPermitidas.map((v) => (
            <button
              key={v}
              className={vistaActual === v ? 'nav-item activo' : 'nav-item'}
              onClick={() => cambiarVista(v)}
            >
              {NAV_ITEMS[v]}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>🌱</p>
          <strong>Cada solicitud suma</strong>
          <span>Entre más seamos, más fuerte la voz.</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="btn-hamburguesa" onClick={() => setMenuAbierto(true)}>☰</button>
          <div className="topbar-spacer" />
          <div className="perfil-topbar">
            <div className="avatar">{iniciales(usuario.nombre)}</div>
            <span>{usuario.nombre}</span>
          </div>
        </header>

        {vistaActual === 'dashboard' && <Dashboard usuario={usuario} />}
        {vistaActual === 'director' && <DirectorView />}
        {vistaActual === 'perfil' && (
          <section className="card perfil-card">
            <div className="avatar grande">{iniciales(usuario.nombre)}</div>
            <h2>{usuario.nombre}</h2>
            <p>{usuario.email}</p>
            <p className="rol-badge">{usuario.rol}</p>
            <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;