import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import type { ApiError } from "../api.types";

function OculusLogo({ size = 90 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx={45} cy={50} r={16} fill="#39568A" />
      <circle cx={45} cy={50} r={7} fill="#FFFFFF" />
      <path d="M 58 42 Q 90 30 95 50 Q 90 70 58 58 Q 75 50 58 42 Z" fill="#39568A" />
      <path d="M 55 58 Q 75 75 70 90 Q 60 80 55 65 Z" fill="#39568A" />
      <path d="M 55 42 Q 72 20 68 8 Q 58 22 52 36 Z" fill="#39568A" />
      <path d="M 29 48 L 12 50 L 29 52 Z" fill="#39568A" />
    </svg>
  );
}

function GosuslugiIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
      <path
        d="M 19 2 L 33 10 L 33 28 L 19 36 L 5 28 L 5 10 Z"
        fill="none"
        stroke="#0065b3"
        strokeWidth="2.5"
      />
      <path
        d="M 19 2 L 33 10"
        stroke="#e52322"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text x="19" y="23" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0065b3" fontFamily="Arial">услуги</text>
    </svg>
  );
}

function Login() {
  const { login, user, initializing } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!initializing && user) {
      if (user.role === "surgeon") navigate("/surgeon", { replace: true });
      else if (user.role === "district_doctor" || user.role === "admin")
        navigate("/doctor", { replace: true });
      else navigate(`/patient/${user.linked_patient_id ?? "unlinked"}`, { replace: true });
    }
  }, [user, initializing, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.error ?? apiErr.detail ?? "Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  }

  if (initializing) return null;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#EAE8EF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'Bitter', Georgia, serif",
    }}>
      <div style={{
        backgroundColor: "#39568A",
        borderRadius: 24,
        padding: "52px 44px 48px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 8px 40px rgba(57,86,138,0.35)",
      }}>
        <h1 style={{
          fontSize: 42,
          fontWeight: 700,
          color: "#FFFFFF",
          textAlign: "center",
          marginBottom: 36,
          fontFamily: "'Bitter', Georgia, serif",
          letterSpacing: "-0.5px",
        }}>
          Вход
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <input
            type="email"
            placeholder="Логин"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={inputStyle}
          />

          {error && (
            <div style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              borderRadius: 10,
              padding: "10px 16px",
              fontSize: 14,
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: "15px",
              backgroundColor: "#EAE8EF",
              color: "#000000",
              border: "none",
              borderRadius: 50,
              fontSize: 20,
              fontFamily: "'Source Serif 4', 'Bitter', Georgia, serif",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.75 : 1,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <div style={{
          marginTop: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "rgba(255,255,255,0.90)",
          fontSize: 15,
          cursor: "pointer",
        }}>
          <span>Войти через Госуслуги</span>
          <GosuslugiIcon />
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px 22px",
  fontSize: 17,
  borderRadius: 50,
  border: "none",
  fontFamily: "'Bitter', Georgia, serif",
  outline: "none",
  backgroundColor: "#FFFFFF",
  color: "#616161",
  boxSizing: "border-box",
};

export default Login;
