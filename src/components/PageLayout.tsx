import Header from "./Header";

type PageLayoutProps = {
  children: React.ReactNode;
  fullName?: string;
};

function PageLayout({ children, fullName }: PageLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header fullName={fullName} />
      <main style={{
        flex: 1,
        paddingTop: 72,
        backgroundColor: "#EAE8EF",
        boxSizing: "border-box",
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E0DEE8",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        fontSize: 12,
        color: "#616161",
      }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span>© 2026 ГБУ РС(Я). Все права защищены.</span>
          <span>Министерство здравоохранения РС(Я)</span>
          <span>Разработка и дизайн "Сухарики"</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="#" style={{ color: "#39568A", textDecoration: "none", fontSize: 12 }}>Пользовательское соглашение</a>
          <a href="#" style={{ color: "#39568A", textDecoration: "none", fontSize: 12 }}>Политика конфиденциальности</a>
        </div>
      </footer>
    </div>
  );
}

export default PageLayout;
