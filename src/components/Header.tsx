import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

type HeaderProps = {
  fullName?: string;
};

function Header({ fullName }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = fullName ?? (user ? `${user.last_name} ${user.first_name[0]}.` : "");

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
      height: 72,
      backgroundColor: "#39568A",
      zIndex: 1000,
      boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    }}>
      <div style={{
        position: "relative",
        height: "100%",
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        boxSizing: "border-box",
      }}>
        {/* Logo icon */}
        <div
          onClick={() => navigate("/")}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            color: "#FFFFFF",
            fontSize: 22,
          }}
          title="На главную"
        >
          👁
        </div>

        {/* Brand name — centered */}
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#FFFFFF",
          borderRadius: 50,
          padding: "7px 22px",
          fontSize: 20,
          fontFamily: "'Bitter', serif",
          fontWeight: 700,
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}>
          <span style={{ color: "#39568A" }}>Офтальмолог</span>
          <span style={{ color: "#000000" }}>.Онлайн</span>
        </div>

        {/* Right: user name + logout */}
        <div style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.85)",
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "4px 8px",
              transition: "color 0.18s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
          >
            Выход
          </button>

          <div style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            color: "#FFFFFF",
            padding: "6px 16px",
            borderRadius: 50,
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
            border: "1px solid rgba(255,255,255,0.25)",
          }}>
            {displayName}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
