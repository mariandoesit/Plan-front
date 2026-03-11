import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

// ─── Colores y constantes ────────────────────────────────────────────────────

const ESTADO_CYCLE  = ["NONE", "CURSANDO", "REGULAR", "PROMOCIONADA"];
const ESTADO_LABELS = { NONE: "Sin cursar", CURSANDO: "Cursando", REGULAR: "Regular", PROMOCIONADA: "Promocionada" };
const ESTADO_COLORS = {
  NONE:         { bg: "#13131f", border: "#252540", text: "#55557a", dot: "#252540", dotBright: "#3a3a60" },
  CURSANDO:     { bg: "#1a1500", border: "#b45309", text: "#fbbf24", dot: "#b45309", dotBright: "#fcd34d" },
  REGULAR:      { bg: "#111a2a", border: "#2563eb", text: "#7eb8f7", dot: "#2563eb", dotBright: "#60a5fa" },
  PROMOCIONADA: { bg: "#1a0f2e", border: "#7c3aed", text: "#c4b5fd", dot: "#7c3aed", dotBright: "#a78bfa" },
};
const DISPONIBLE = {
  bg: "#0e1a18", border: "#0d9488", text: "#5eead4",
  glow: "0 0 0 2px rgba(13,148,136,0.18), 0 0 18px rgba(13,148,136,0.18)",
  dot: "#0d9488",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcularDisponibles(materias, estados) {
  const cursadas = new Set(
    Object.entries(estados)
      .filter(([, v]) => v === "REGULAR" || v === "PROMOCIONADA")
      .map(([k]) => k)
  );
  return new Set(
    materias
      .filter(m =>
        (estados[m.codigo] === "NONE" || !estados[m.codigo]) &&
        m.correlativas.length > 0 &&
        m.correlativas.every(c => cursadas.has(c))
      )
      .map(m => m.codigo)
  );
}

// ─── Componentes pequeños ────────────────────────────────────────────────────

function Tag({ color, bg, label }) {
  return (
    <div style={{
      position: "absolute", top: -9, right: 10,
      fontSize: 8, color, background: bg,
      padding: "2px 7px", borderRadius: 4,
      border: `1px solid ${color}`, letterSpacing: 1.5, fontWeight: 700,
    }}>
      {label}
    </div>
  );
}

function StatChip({ label, value, color, glow }) {
  return (
    <div style={{
      background: glow ? "#0e1a18" : "#0e0e1c",
      border: `1px solid ${color}33`,
      borderRadius: 7, padding: "6px 14px", textAlign: "center", minWidth: 64,
      boxShadow: glow && value > 0 ? `0 0 12px rgba(13,148,136,0.25)` : "none",
      transition: "box-shadow 0.3s ease",
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 8, color: glow ? "#1a4a44" : "#33335a", letterSpacing: 2, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function LegendItem({ color, label, glow }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: color,
        display: "inline-block",
        boxShadow: glow ? `0 0 6px ${color}` : "none",
      }} />
      {label}
    </span>
  );
}

// ─── Pantalla de Login / Register ────────────────────────────────────────────

function AuthScreen({ onLogin }) {
  const [modo, setModo]       = useState("login"); // "login" | "register"
  const [nombre, setNombre]   = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const url  = modo === "login" ? `${API}/api/auth/login` : `${API}/api/auth/register`;
      const body = modo === "login"
        ? { email, password }
        : { nombre, email, password };

      const res  = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al conectar");

      onLogin(data.token, data.nombre);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "#0e0e1c", border: "1px solid #252540",
    borderRadius: 8, padding: "10px 14px", color: "#e2e2f0",
    fontFamily: "inherit", fontSize: 13, outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0b16",
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#0e0e1c", border: "1px solid #1a1a30",
        borderRadius: 16, padding: "40px 36px", width: 360,
      }}>
        {/* Título */}
        <div style={{ fontSize: 11, color: "#2e2e52", letterSpacing: 3, marginBottom: 8 }}>
          PLAN DE ESTUDIOS
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#e2e2f0", marginBottom: 32 }}>
          {modo === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </div>

        {/* Campos */}
        {modo === "register" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#3a3a60", letterSpacing: 2, marginBottom: 6 }}>NOMBRE</div>
            <input
              style={inputStyle}
              placeholder="Tu nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#3a3a60", letterSpacing: 2, marginBottom: 6 }}>EMAIL</div>
          <input
            style={inputStyle}
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: "#3a3a60", letterSpacing: 2, marginBottom: 6 }}>CONTRASEÑA</div>
          <input
            style={inputStyle}
            type="password"
            placeholder="••••••"
            value={password}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#1a0a0a", border: "1px solid #7c2020",
            borderRadius: 7, padding: "8px 12px",
            fontSize: 11, color: "#f87171", marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Botón */}
        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%", background: loading ? "#1a1a30" : "#2563eb",
            border: "none", borderRadius: 8, padding: "11px",
            color: "#fff", fontFamily: "inherit", fontSize: 12,
            fontWeight: 700, letterSpacing: 1, cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Conectando..." : modo === "login" ? "ENTRAR" : "REGISTRARSE"}
        </button>

        {/* Cambiar modo */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#2e2e52" }}>
          {modo === "login" ? (
            <>¿No tenés cuenta?{" "}
              <span onClick={() => { setModo("register"); setError(""); }}
                style={{ color: "#2563eb", cursor: "pointer" }}>Registrate</span>
            </>
          ) : (
            <>¿Ya tenés cuenta?{" "}
              <span onClick={() => { setModo("login"); setError(""); }}
                style={{ color: "#2563eb", cursor: "pointer" }}>Iniciá sesión</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Plan de estudios principal ───────────────────────────────────────────────

function PlanEstudio({ token, nombre, onLogout }) {
  const [materias, setMaterias] = useState([]);
  const [estados,  setEstados]  = useState({});
  const [hovering, setHovering] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  // Cargar materias al montar
  useEffect(() => {
    const cargar = async () => {
      try {
        const res  = await fetch(`${API}/api/materias`, { headers });
        if (!res.ok) throw new Error("Error al cargar materias");
        const data = await res.json();
        setMaterias(data);
        const est = {};
        data.forEach(m => { est[m.codigo] = m.estado || "NONE"; });
        setEstados(est);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const disponibles = calcularDisponibles(materias, estados);

  const toggleEstado = async (codigo) => {
    const idx      = ESTADO_CYCLE.indexOf(estados[codigo]);
    const nuevoEst = ESTADO_CYCLE[(idx + 1) % ESTADO_CYCLE.length];

    // Actualizar UI inmediatamente (optimistic update)
    setEstados(prev => ({ ...prev, [codigo]: nuevoEst }));

    // Guardar en el backend
    try {
      const res = await fetch(`${API}/api/materias/progreso`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ materiaCodigo: codigo, estado: nuevoEst }),
      });
      if (!res.ok) throw new Error("Error al guardar");
    } catch (e) {
      // Revertir si falla
      setEstados(prev => ({ ...prev, [codigo]: estados[codigo] }));
    }
  };

  const getRole = (codigo) => {
    if (!hovering) return "normal";
    if (codigo === hovering) return "selected";
    const matHov = materias.find(m => m.codigo === hovering);
    if (matHov?.correlativas.includes(codigo)) return "previa";
    const dep = materias.find(m => m.codigo === codigo);
    if (dep?.correlativas.includes(hovering)) return "desbloquea-hover";
    return "dimmed";
  };

  const getAnioEstado = (anio) => {
    const mats = materias.filter(m => m.anio === anio);
    const todasCursadas = mats.every(m => estados[m.codigo] === "REGULAR" || estados[m.codigo] === "PROMOCIONADA");
    if (todasCursadas) return "completo";
    if (hovering && mats.some(m => m.codigo === hovering)) return "activo";
    if (hovering) {
      const matHov = materias.find(m => m.codigo === hovering);
      const tieneRelacion = mats.some(m => {
        if (m.codigo === hovering) return true;
        if (matHov?.correlativas.includes(m.codigo)) return true;
        if (m.correlativas.includes(hovering)) return true;
        return false;
      });
      if (tieneRelacion) return "activo";
    }
    return "inactivo";
  };

  const ANIO_ESTILOS = {
    inactivo: { color: "#1c1c38", textShadow: "none",                                    borderColor: "transparent" },
    activo:   { color: "#5555cc", textShadow: "0 0 20px rgba(100,100,220,0.5)",           borderColor: "#2a2a6a" },
    completo: { color: "#a78bfa", textShadow: "0 0 24px rgba(167,139,250,0.6)",           borderColor: "#4a2a8a" },
  };

  const stats = {
    promo:      Object.values(estados).filter(e => e === "PROMOCIONADA").length,
    regular:    Object.values(estados).filter(e => e === "REGULAR").length,
    none:       Object.values(estados).filter(e => e === "NONE").length,
    disponible: disponibles.size,
  };
  const pct = materias.length > 0
    ? Math.round(((stats.promo + stats.regular) / materias.length) * 100)
    : 0;

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: "#0b0b16",
      fontFamily: "'IBM Plex Mono', monospace",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#2e2e52", fontSize: 13, letterSpacing: 2,
    }}>
      CARGANDO MATERIAS...
    </div>
  );

  if (error) return (
    <div style={{
      minHeight: "100vh", background: "#0b0b16",
      fontFamily: "'IBM Plex Mono', monospace",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#f87171", fontSize: 13,
    }}>
      {error}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0b16",
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      color: "#e2e2f0", paddingBottom: 60,
    }}>

      {/* HEADER */}
      <header style={{
        background: "#08080f", borderBottom: "1px solid #1a1a30",
        padding: "18px 48px", position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", gap: 32,
      }}>
        <div>
          <div style={{ fontSize: 9, color: "#2e2e52", letterSpacing: 3 }}>INGENIERÍA EN INFORMÁTICA</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e2f0", marginTop: 2 }}>Plan de Estudios</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginLeft: 8 }}>
          <StatChip label="PROMO"      value={stats.promo}      color="#7c3aed" />
          <StatChip label="REGULAR"    value={stats.regular}    color="#2563eb" />
          <StatChip label="DISPONIBLES" value={stats.disponible} color="#0d9488" glow />
          <StatChip label="SIN CURSAR" value={stats.none - stats.disponible} color="#252540" />
        </div>

        {/* Barra de progreso */}
        <div style={{ flex: 1, maxWidth: 240 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#2e2e52", marginBottom: 5 }}>
            <span>PROGRESO</span><span>{pct}%</span>
          </div>
          <div style={{ height: 4, background: "#1a1a30", borderRadius: 4 }}>
            <div style={{
              height: "100%", borderRadius: 4, width: `${pct}%`,
              background: "linear-gradient(90deg, #2563eb, #7c3aed)",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* Usuario + logout */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 11, color: "#3a3a60" }}>{nombre}</span>
          <button
            onClick={onLogout}
            style={{
              background: "transparent", border: "1px solid #252540",
              borderRadius: 6, padding: "5px 12px", color: "#3a3a60",
              fontFamily: "inherit", fontSize: 9, letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            SALIR
          </button>
        </div>
      </header>

      {/* LEYENDA */}
      <div style={{
        padding: "10px 48px", borderBottom: "1px solid #0f0f1e",
        display: "flex", gap: 24, fontSize: 10, color: "#2e2e52",
        letterSpacing: 1, alignItems: "center",
      }}>
        <span>HOVER → ver correlativas</span>
        <span>CLICK en estado → cambiar</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 18 }}>
          <LegendItem color="#3a3a60" label="Sin cursar" />
          <LegendItem color="#0d9488" label="Disponible" glow />
	  <LegendItem color="#fbbf24" label="Cursando" />
          <LegendItem color="#2563eb" label="Regular" />
          <LegendItem color="#7c3aed" label="Promocionada" />
          <LegendItem color="#16a34a" label="Previa" />
          <LegendItem color="#ea580c" label="Desbloquea" />
        </div>
      </div>

      {/* AÑOS */}
      <div style={{ padding: "36px 48px", display: "flex", flexDirection: "column", gap: 24 }}>
        {[1,2,3,4,5].map(anio => {
          const mats      = materias.filter(m => m.anio === anio);
          const anioEst   = getAnioEstado(anio);
          const anioStyle = ANIO_ESTILOS[anioEst];

          return (
            <div key={anio} style={{ display: "flex", alignItems: "stretch" }}>

              {/* Número de año */}
              <div style={{
                width: 68, flexShrink: 0, display: "flex",
                flexDirection: "column", alignItems: "flex-end",
                justifyContent: "center", paddingRight: 18,
              }}>
                <div style={{
                  fontSize: 28, fontWeight: 700, lineHeight: 1,
                  userSelect: "none", color: anioStyle.color,
                  textShadow: anioStyle.textShadow,
                  transition: "color 0.25s ease, text-shadow 0.25s ease",
                }}>
                  {anio === 1 ? "CBC" : String(anio - 1).padStart(2, "0")}
                </div>
                {anioEst === "completo" && (
                  <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: 1, marginTop: 4 }}>
                    COMPLETO
                  </div>
                )}
              </div>

              {/* Separador vertical */}
              <div style={{
                width: 1, flexShrink: 0, marginRight: 22,
                background: anioEst === "completo"
                  ? "linear-gradient(to bottom, #6a3aaa 0%, #3a1a7a 100%)"
                  : anioEst === "activo"
                  ? "linear-gradient(to bottom, #3a3aaa 0%, #1a1a5a 100%)"
                  : "linear-gradient(to bottom, #1e1e38 0%, #0f0f20 100%)",
                transition: "background 0.25s ease",
              }} />

              {/* Cards */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignContent: "flex-start", flex: 1 }}>
                {mats.map(m => {
                  const role     = getRole(m.codigo);
                  const est      = estados[m.codigo] || "NONE";
                  const col      = ESTADO_COLORS[est];
                  const isDisp   = disponibles.has(m.codigo);

                  const isHov    = role === "selected";
                  const isPrevia = role === "previa";
                  const isDes    = role === "desbloquea-hover";
                  const isDim    = role === "dimmed";

                  let borderColor = isDisp ? DISPONIBLE.border : col.border;
                  let bgColor     = isDisp ? DISPONIBLE.bg     : col.bg;
                  let textColor   = isDisp ? DISPONIBLE.text   : col.text;
                  let shadow      = isDisp ? DISPONIBLE.glow   : "none";
                  let tagEl       = null;

                  if (isHov) {
                    borderColor = "#5555cc"; bgColor = "#14142a";
                    shadow = "0 0 0 3px rgba(100,100,220,0.12), 0 4px 20px rgba(50,50,180,0.18)";
                    textColor = isDisp ? DISPONIBLE.text : col.text;
                  } else if (isPrevia) {
                    borderColor = "#16a34a"; bgColor = "#0c180e"; textColor = "#86efac";
                    shadow = "0 0 10px rgba(22,163,74,0.12)";
                    tagEl = <Tag color="#16a34a" bg="#0a150c" label="PREVIA" />;
                  } else if (isDes) {
                    borderColor = "#ea580c"; bgColor = "#190e07"; textColor = "#fdba74";
                    shadow = "0 0 10px rgba(234,88,12,0.12)";
                    tagEl = <Tag color="#ea580c" bg="#160a00" label="DESBLOQUEA" />;
                  }

                  const btnColor    = isDisp && est === "NONE" ? DISPONIBLE.dot : col.dot;
                  const btnColorBrt = isDisp && est === "NONE" ? DISPONIBLE.dot : col.dotBright;

                  return (
                    <div
                      key={m.codigo}
                      onMouseEnter={() => setHovering(m.codigo)}
                      onMouseLeave={() => setHovering(null)}
                      style={{
                        background: bgColor, border: `1.5px solid ${borderColor}`,
                        borderRadius: 10, padding: tagEl ? "16px 14px 10px" : "12px 14px 10px",
                        minWidth: 158, maxWidth: 210,
                        opacity: isDim ? 0.2 : 1,
                        transition: "all 0.14s ease", cursor: "default",
                        position: "relative", boxShadow: shadow,
                      }}
                    >
                      {tagEl}

                      {isDisp && !tagEl && (
                        <div style={{
                          position: "absolute", top: 11, right: 12,
                          width: 7, height: 7, borderRadius: "50%",
                          background: DISPONIBLE.dot,
                          boxShadow: `0 0 8px ${DISPONIBLE.dot}`,
                          animation: "pulse 2s infinite",
                        }} />
                      )}

                      <div style={{
                        fontSize: 12, fontWeight: 600, color: textColor,
                        lineHeight: 1.35, marginBottom: 10,
                        paddingRight: isDisp && !tagEl ? 16 : 0,
                      }}>
                        {m.nombre}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button
                          onClick={() => toggleEstado(m.codigo)}
                          style={{
                            background: "transparent", border: `1px solid ${btnColor}`,
                            borderRadius: 5, padding: "3px 8px", cursor: "pointer",
                            fontSize: 9, color: btnColorBrt, letterSpacing: 1,
                            display: "flex", alignItems: "center", gap: 5,
                            fontFamily: "inherit", transition: "background 0.12s",
                          }}
                        >
                          <span style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: btnColorBrt, display: "inline-block",
                          }} />
                          {ESTADO_LABELS[est].toUpperCase()}
                        </button>

                        {m.correlativas.length > 0 && (
                          <span style={{ fontSize: 9, color: "#252545" }}>
                            {m.correlativas.length} prev
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.65); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── App principal ────────────────────────────────────────────────────────────

export default function App() {
  const [token,  setToken]  = useState(null);
  const [nombre, setNombre] = useState("");

  const handleLogin = (token, nombre) => {
    setToken(token);
    setNombre(nombre);
  };

  const handleLogout = () => {
    setToken(null);
    setNombre("");
  };

  if (!token) return <AuthScreen onLogin={handleLogin} />;
  return <PlanEstudio token={token} nombre={nombre} onLogout={handleLogout} />;
}
