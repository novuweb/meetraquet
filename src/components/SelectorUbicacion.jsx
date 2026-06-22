import { PROVINCIAS, esProvinciaCanaria, getIslas } from '../lib/provincias';

// Selector reutilizable de provincia + isla (Canarias)
export default function SelectorUbicacion({ provincia, isla, onChangeProvincia, onChangeIsla }) {
  const islas = getIslas(provincia);

  return (
    <>
      <div className="form-group">
        <label>Provincia</label>
        <select value={provincia} onChange={(e) => onChangeProvincia(e.target.value)} required>
          <option value="" disabled>Selecciona tu provincia</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {esProvinciaCanaria(provincia) && (
        <div className="form-group">
          <label>Isla</label>
          <select value={isla || ''} onChange={(e) => onChangeIsla(e.target.value)} required>
            <option value="" disabled>Selecciona tu isla</option>
            {islas.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
