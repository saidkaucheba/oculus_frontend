import { useNavigate } from "react-router-dom";

type HeaderProps = {
  fullName: string;
};

function Header({ fullName }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      style={{
        height: 64,
        backgroundColor: "#39568A",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
      }}
    >
      {/* Пусто слева — чтобы всё было справа */}
      <div />

      {/* Правая часть */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Выход */}
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "transparent",
            border: "none",
            color: "#FFFFFF",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Выход
        </button>

        {/* Профиль */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            padding: "6px 12px",
            borderRadius: 16,
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          {fullName}
        </div>
      </div>
    </header>
  );
}

export default Header;