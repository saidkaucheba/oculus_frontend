import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import type { ApiError } from "../api.types";

function Login() {
  const { login, user, initializing } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in → redirect
  useEffect(() => {
    if (!initializing && user) {
      if (user.role === "surgeon") navigate("/surgeon", { replace: true });
      else if (user.role === "district_doctor" || user.role === "admin")
        navigate("/doctor", { replace: true });
      else navigate(`/patient/${user.id}`, { replace: true });
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
      setError(apiErr.error ?? apiErr.detail ?? "Ошибка входа");
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
      padding: "24px",
    }}>
      {/* Blue card — matches the design PDF */}
      <div style={{
        backgroundColor: "#39568A",
        borderRadius: 24,
        padding: "48px 40px 44px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 8px 40px rgba(57,86,138,0.25)",
      }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 700,
          color: "#FFFFFF",
          textAlign: "center",
          marginBottom: 36,
          fontFamily: "'Bitter', serif",
        }}>
          Вход
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="email"
            placeholder="Логин"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={fieldStyle}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={fieldStyle}
          />

          {error && (
            <div style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              borderRadius: 10,
              padding: "10px 14px",
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
              marginTop: 8,
              padding: "16px",
              backgroundColor: "#F0EFF4",
              color: "#000000",
              border: "none",
              borderRadius: 50,
              fontSize: 18,
              fontFamily: "'Source Serif 4', serif",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.18s",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        {/* Gosuslugi link — shown in design */}
        <div style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "rgba(255,255,255,0.75)",
          fontSize: 14,
        }}>
          <span>Войти через Госуслуги</span>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0065b3, #0097fd)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "#FFFFFF",
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}>
            ГУ
          </div>
        </div>
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  fontSize: 16,
  borderRadius: 50,
  border: "none",
  fontFamily: "'Bitter', serif",
  outline: "none",
  backgroundColor: "#FFFFFF",
  color: "#000000",
  boxSizing: "border-box",
};

export default Login;
