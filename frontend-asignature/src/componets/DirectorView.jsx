import { useState, useEffect } from 'react';
import { API_URL } from '../Api';

function DirectorView() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [expandidaId, setExpandidaId] = useState(null);
  const [adherentesCache, setAdherentesCache] = useState({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/solicitudes/director`)
      .then((res) => res.json())
      .then((data) => setSolicitudes(data))
      .catch((err) => console.error('Error al cargar solicitudes:', err));
  }, []);

  const verAdherentes = (solicitudId) => {
    if (expandidaId === solicitudId) {
      setExpandidaId(null);
      return;
    }

    if (adherentesCache[solicitudId]) {
      setExpandidaId(solicitudId);
      return;
    }

    setCargando(true);
    fetch(`${API_URL}/solicitudes/${solicitudId}/adherentes`)
      .then((res) => res.json())
      .then((data) => {
        setAdherentesCache((prev) => ({ ...prev, [solicitudId]: data }));
        setExpandidaId(solicitudId);
      })
      .catch((err) => console.error('Error al cargar adherentes:', err))
      .finally(() => setCargando(false));
  };

  return (
    <div>
      <section className="banner banner-director">
        <div>
          <h1>📊 Vista del Director</h1>
          <p>Consulta la demanda real de cada solicitud y quiénes la respaldan.</p>
        </div>
      </section>

      <section className="card">
        <h2>Todas las solicitudes</h2>
        {solicitudes.length === 0 && <p className="vacio">Todavía no hay solicitudes registradas.</p>}
        <div className="lista-director">
          {solicitudes.map((s) => (
            <div key={s.id} className="item-director">
              <div className="item-director-info">
                <strong>{s.asignatura}</strong>
                <span>{s.horario}</span>
                <span className="creador">Creada por {s.creador?.nombre ?? 'desconocido'}</span>
              </div>

              <div className="item-director-acciones">
                <span className="contador contador-grande">👥 {s.totalAdhesiones}</span>
                <button className="btn-ver-adherentes" onClick={() => verAdherentes(s.id)}>
                  {expandidaId === s.id ? 'Ocultar' : 'Ver quién se sumó'}
                </button>
              </div>

              {expandidaId === s.id && (
                <ul className="lista-adherentes">
                  {cargando && !adherentesCache[s.id] && <li>Cargando...</li>}
                  {adherentesCache[s.id]?.length === 0 && (
                    <li className="vacio">Nadie se ha sumado todavía.</li>
                  )}
                  {adherentesCache[s.id]?.map((u) => (
                    <li key={u.id}>{u.nombre}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DirectorView;