import { useNavigate } from "react-router-dom";
import logo from "../assets/Ellipse 10.png";

type HeaderProps = {
  fullName: string;
};

function Header({ fullName }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 80,
        backgroundColor: "#39568A",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <img
          src={logo}
          alt="Логотип"
          style={{
            width: 48,
            height: 48,
            objectFit: "contain",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: "8px 20px",
            fontSize: 24,
            fontWeight: 600,
            fontFamily: "Bitter, serif",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "#39568A" }}>Офтальмолог</span>
          <span style={{ color: "#000000" }}>.Онлайн</span>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(255,255,255)",
              color: "#00000",
              padding: "6px 14px",
              borderRadius: 16,
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            {fullName}
          </div>

          <button
            onClick={() => navigate("/login")}
            style={{
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              fontSize: 16,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Выход
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;