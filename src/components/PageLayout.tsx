import Header from "./Header";

type PageLayoutProps = {
  children: React.ReactNode;
  fullName: string;
};

function PageLayout({ children, fullName }: PageLayoutProps) {
  return (
    <div>
      <Header fullName={fullName} />

      <main
        style={{
          paddingTop: 80,
          minHeight: "100vh",
          backgroundColor: "#EAE8EF",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default PageLayout;