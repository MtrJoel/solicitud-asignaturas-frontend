import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://solicitud-asignaturas.onrender.com';
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function iniciales(nombre) {
  return nombre.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function parseHorario(horario) {
  const match = horario.match(/^(.+) de (\d{1,2}):00 (AM|PM) a (\d{1,2}):00 (AM|PM)$/);
  if (!match) return null;
  const [, dia, hDesde, pDesde, hHasta, pHasta] = match;
  return { dia, horaDesde: hDesde, periodoDesde: pDesde, horaHasta: hHasta, periodoHasta: pHasta };
}

function App() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  const [vista, setVista] = useState('inicio');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [solicitudes, setSolicitudes] = useState([]);
  const [misAdhesionesIds, setMisAdhesionesIds] = useState([]);
  const [asignatura, setAsignatura] = useState('');
  const [dia, setDia] = useState(DIAS[0]);
  const [horaDesde, setHoraDesde] = useState('7');
  const [periodoDesde, setPeriodoDesde] = useState('PM');
  const [horaHasta, setHoraHasta] = useState('9');
  const [periodoHasta, setPeriodoHasta] = useState('PM');
  const [mensaje, setMensaje] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  const cargarSolicitudes = () => {
    fetch(`${API_URL}/solicitudes/director`)
      .then((res) => res.json())
      .then((data) => setSolicitudes(data))
      .catch((err) => console.error('Error al cargar solicitudes:', err));
  };

  const cargarMisAdhesiones = (usuarioId) => {
    fetch(`${API_URL}/solicitudes/misAdhesiones/${usuarioId}`)
      .then((res) => res.json())
      .then((data) => setMisAdhesionesIds(data))
      .catch((err) => console.error('Error al cargar adhesiones:', err));
  };

  useEffect(() => {
    if (usuario) {
      cargarSolicitudes();
      cargarMisAdhesiones(usuario.id);
    }
  }, [usuario]);

  useEffect(() => {
    if (!mensaje) return;
    const timeout = setTimeout(() => setMensaje(''), 3000);
    return () => clearTimeout(timeout);
  }, [mensaje]);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorLogin('');

    fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Credenciales inválidas');
        return res.json();
      })
      .then((data) => {
        setUsuario(data);
        localStorage.setItem('usuario', JSON.stringify(data));
      })
      .catch((err) => setErrorLogin(err.message));
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
    setSolicitudes([]);
    setMisAdhesionesIds([]);
  };

  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
    setMenuAbierto(false);
  };

  const limpiarFormulario = () => {
    setAsignatura('');
    setDia(DIAS[0]);
    setHoraDesde('7');
    setPeriodoDesde('PM');
    setHoraHasta('9');
    setPeriodoHasta('PM');
    setEditandoId(null);
  };

  const handleGuardarSolicitud = (e) => {
    e.preventDefault();
    const horario = `${dia} de ${horaDesde}:00 ${periodoDesde} a ${horaHasta}:00 ${periodoHasta}`;

    if (editandoId) {
      fetch(`${API_URL}/solicitudes/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asignatura, horario }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('No se pudo actualizar la solicitud');
          return res.json();
        })
        .then(() => {
          setMensaje('¡Solicitud actualizada!');
          limpiarFormulario();
          cargarSolicitudes();
        })
        .catch((err) => setMensaje(err.message));
      return;
    }

    fetch(`${API_URL}/solicitudes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asignatura, horario, creador: { id: usuario.id } }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo crear la solicitud');
        return res.json();
      })
      .then(() => {
        setMensaje('¡Solicitud creada!');
        limpiarFormulario();
        cargarSolicitudes();
      })
      .catch((err) => setMensaje(err.message));
  };

  const handleEditar = (s) => {
    setAsignatura(s.asignatura);
    const partes = parseHorario(s.horario);
    if (partes) {
      setDia(partes.dia);
      setHoraDesde(partes.horaDesde);
      setPeriodoDesde(partes.periodoDesde);
      setHoraHasta(partes.horaHasta);
      setPeriodoHasta(partes.periodoHasta);
    }
    setEditandoId(s.id);
    cambiarVista('inicio');
  };

  const handleEliminar = (id) => {
    const confirmar = window.confirm('¿Seguro que quieres eliminar esta solicitud? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    fetch(`${API_URL}/solicitudes/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo eliminar la solicitud');
        setMensaje('Solicitud eliminada');
        cargarSolicitudes();
      })
      .catch((err) => setMensaje(err.message));
  };

  const handleSumarse = (solicitudId) => {
    fetch(`${API_URL}/solicitudes/${solicitudId}/unirse/${usuario.id}`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo sumar (¿ya estabas sumado?)');
        return res.json();
      })
      .then(() => {
        setMensaje('¡Te sumaste a la solicitud!');
        cargarSolicitudes();
        cargarMisAdhesiones(usuario.id);
      })
      .catch((err) => setMensaje(err.message));
  };

  const handleDarseDeBaja = (solicitudId) => {
    fetch(`${API_URL}/solicitudes/${solicitudId}/salir/${usuario.id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo dar de baja');
        setMensaje('Te diste de baja de la solicitud');
        cargarSolicitudes();
        cargarMisAdhesiones(usuario.id);
      })
      .catch((err) => setMensaje(err.message));
  };

  // ---------- Login ----------
  if (!usuario) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🎓</div>
          <h1>Quorom Académico</h1>
          <p className="subtitle">Bienvenido de nuevo, inicia sesión para continuar</p>

          {errorLogin && <p className="mensaje error">{errorLogin}</p>}

          <form onSubmit={handleLogin}>
            <label>Correo</label>
            <input
              type="email"
              placeholder="tucorreo@universidad.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  const misSolicitudes = solicitudes.filter((s) => s.creador.id === usuario.id);
  const otrasSolicitudes = solicitudes
    .filter((s) => s.creador.id !== usuario.id)
    .filter((s) => s.asignatura.toLowerCase().includes(busqueda.toLowerCase()));

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
          <button className={vista === 'inicio' ? 'nav-item activo' : 'nav-item'} onClick={() => cambiarVista('inicio')}>🏠 Inicio</button>
          <button className={vista === 'mis' ? 'nav-item activo' : 'nav-item'} onClick={() => cambiarVista('mis')}>📌 Mis Solicitudes</button>
          <button className={vista === 'todas' ? 'nav-item activo' : 'nav-item'} onClick={() => cambiarVista('todas')}>📋 Todas las Solicitudes</button>
          <button className={vista === 'perfil' ? 'nav-item activo' : 'nav-item'} onClick={() => cambiarVista('perfil')}>👤 Perfil</button>
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
          <input
            className="buscador"
            type="text"
            placeholder="🔍 Buscar materia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="perfil-topbar">
            <div className="avatar">{iniciales(usuario.nombre)}</div>
            <span>{usuario.nombre}</span>
          </div>
        </header>

        {mensaje && <p className="mensaje">{mensaje}</p>}

        {vista === 'inicio' && (
          <>
            <section className="banner">
              <div>
                <h1>¡Hola, {usuario.nombre.split(' ')[0]}!</h1>
                <p>Aquí puedes crear solicitudes y sumarte a las de tus compañeros.</p>
              </div>
              <span className="banner-frase">Grandes metas requieren constancia</span>
            </section>

            <section className="card">
              <h2>{editandoId ? '✏️ Editar solicitud' : '✏️ Nueva solicitud'}</h2>
              <form onSubmit={handleGuardarSolicitud} className="form-crear">
                <input
                  type="text"
                  placeholder="Asignatura (ej. Base de Datos II)"
                  value={asignatura}
                  onChange={(e) => setAsignatura(e.target.value)}
                  required
                />

                <div className="fila-dia">
                  <label>Día de clase</label>
                  <select value={dia} onChange={(e) => setDia(e.target.value)}>
                    {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="fila-horas">
                  <div className="campo-hora">
                    <label>Desde</label>
                    <div className="hora-grupo">
                      <select value={horaDesde} onChange={(e) => setHoraDesde(e.target.value)}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <option key={h} value={h}>{h}:00</option>
                        ))}
                      </select>
                      <select value={periodoDesde} onChange={(e) => setPeriodoDesde(e.target.value)}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <span className="guion">—</span>

                  <div className="campo-hora">
                    <label>Hasta</label>
                    <div className="hora-grupo">
                      <select value={horaHasta} onChange={(e) => setHoraHasta(e.target.value)}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <option key={h} value={h}>{h}:00</option>
                        ))}
                      </select>
                      <select value={periodoHasta} onChange={(e) => setPeriodoHasta(e.target.value)}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="botones-form">
                  <button type="submit">{editandoId ? 'Guardar cambios' : 'Crear solicitud'}</button>
                  {editandoId && (
                    <button type="button" className="btn-cancelar" onClick={limpiarFormulario}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </section>
          </>
        )}

        {(vista === 'inicio' || vista === 'mis') && (
          <section className="card">
            <h2>📌 Mis solicitudes activas</h2>
            {misSolicitudes.length === 0 && <p className="vacio">Aún no has creado ninguna solicitud.</p>}
            <div className="grid">
              {misSolicitudes.map((s) => (
                <div key={s.id} className="materia-card propia">
                  <strong>{s.asignatura}</strong>
                  <span>{s.horario}</span>
                  <span className="contador">👥 {s.totalAdhesiones} sumados</span>
                  <div className="acciones-propia">
                    <span className="badge">Tuya</span>
                    <div className="botones-acciones">
                      <button className="btn-editar" onClick={() => handleEditar(s)}>Editar</button>
                      <button className="btn-eliminar" onClick={() => handleEliminar(s.id)}>Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(vista === 'inicio' || vista === 'todas') && (
          <section className="card">
            <h2>📋 Solicitudes de otros estudiantes</h2>
            {otrasSolicitudes.length === 0 && <p className="vacio">No hay solicitudes que coincidan.</p>}
            <div className="grid">
              {otrasSolicitudes.map((s) => {
                const yaSumado = misAdhesionesIds.includes(s.id);
                return (
                  <div key={s.id} className="materia-card">
                    <strong>{s.asignatura}</strong>
                    <span>{s.horario}</span>
                    <span className="contador">👥 {s.totalAdhesiones} sumados</span>
                    {yaSumado ? (
                      <button className="btn-baja" onClick={() => handleDarseDeBaja(s.id)}>
                        Darse de baja
                      </button>
                    ) : (
                      <button className="btn-sumarse" onClick={() => handleSumarse(s.id)}>
                        Sumarme
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {vista === 'perfil' && (
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