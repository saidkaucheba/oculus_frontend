import Header from "./Header";

type PageLayoutProps = {
  children: React.ReactNode;
  fullName?: string;
};

function PageLayout({ children, fullName }: PageLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#EAE8EF" }}>
      <Header fullName={fullName} />
      <main style={{
        flex: 1,
        paddingTop: 64,
        boxSizing: "border-box",
      }}>
        {children}
      </main>

      <footer style={{
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #D8D6E0",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 8,
        fontSize: 12,
        color: "#616161",
        fontFamily: "'Bitter', Georgia, serif",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span>© 2026 ГБУ РС(Я). Все права защищены.</span>
          <a href="#" style={{ color: "#39568A", textDecoration: "none" }}>Министерство здравоохранения РС(Я)</a>
          <a href="#" style={{ color: "#39568A", textDecoration: "none" }}>Разработка и дизайн «Сухарики»</a>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "right" }}>
          <a href="#" style={{ color: "#39568A", textDecoration: "none" }}>Пользовательское соглашение</a>
          <a href="#" style={{ color: "#39568A", textDecoration: "none" }}>Политика конфиденциальности</a>
        </div>
      </footer>
    </div>
  );
}

export default PageLayout;
