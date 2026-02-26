import Header from "./Header";

type PageLayoutProps = {
  fullName: string;
  children: React.ReactNode;
};

function PageLayout({ fullName, children }: PageLayoutProps) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#EAE8EF",
      }}
    >
      <Header fullName={fullName} />

      <div
        style={{
          padding: 16,        // одинаково на всех экранах
          width: "100%",      // 🔥 НИКАКИХ maxWidth
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PageLayout;