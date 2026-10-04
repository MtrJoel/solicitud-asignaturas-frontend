const URL_LOCAL = 'http://localhost:8080';
const URL_PRODUCCION = 'https://solicitud-asignaturas.onrender.com';

// npm run dev -> local | npm run build (Vercel) -> producción
export const API_URL = import.meta.env.DEV ? URL_LOCAL : URL_PRODUCCION;