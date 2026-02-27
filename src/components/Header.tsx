import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import SyncIndicator from "./SyncIndicator";
import logoImage from "../assets/Ellipse 10.png";

export function OculusLogo({ size = 89, invert = false }: { size?: number; invert?: boolean }) {
  return (
    <img 
      src={logoImage}
      alt="Офтальмолог.Онлайн"
      width={size}
      height={size}
      style={{
        display: 'block',
      }}
    />
  );
}

type HeaderProps = { fullName?: string };

function Header({ fullName }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = fullName ?? (user
    ? `${user.last_name} ${user.first_name[0]}.${user.middle_name ? ` ${user.middle_name[0]}.` : ""}`
    : "");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: 64,
      backgroundColor: "#39568A",
      zIndex: 1000,
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
    }}>
      <div style={{
        position: "relative",
        height: "100%",
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
      }}>

        <div
          onClick={() => navigate("/")}
          style={{ cursor: "pointer", flexShrink: 0, lineHeight: 0 }}
          title="На главную"
        >
          <OculusLogo size={44} invert />
        </div>

        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 50,
            padding: "6px 24px",
            fontSize: 20,
            fontFamily: "'Bitter', Georgia, serif",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}>
            <span style={{ color: "#39568A", fontWeight: 700 }}>Офтальмолог</span>
            <span style={{ color: "#000000", fontWeight: 400 }}>.Онлайн</span>
          </div>
        </div>

        <div style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}>
          <SyncIndicator />

          <span style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 15,
            cursor: "pointer",
            padding: "4px 8px",
            fontFamily: "'Bitter', Georgia, serif",
          }}
            onClick={handleLogout}
          >
            Выход
          </span>

          <div style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "#FFFFFF",
            padding: "6px 18px",
            borderRadius: 50,
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
            fontFamily: "'Bitter', Georgia, serif",
          }}>
            {displayName}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
