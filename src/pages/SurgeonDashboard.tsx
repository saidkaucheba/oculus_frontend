import PageLayout from "../components/PageLayout";

function SurgeonDashboard() {
  return (
    <PageLayout fullName="Смирнов Иван Андреевич">
      <h1>Кабинет хирурга</h1>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          maxWidth: 500,
        }}
      >
        <h2>Бабушка Зина</h2>

        <p style={{ color: "#616161" }}>
          Карточка ожидает проверки
        </p>

        <button
          style={{
            padding: "12px 20px",
            fontSize: 16,
            backgroundColor: "#39568A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Подтвердить
        </button>

        <br /><br />

        <textarea
          placeholder="Комментарий районному врачу"
          style={{
            width: "100%",
            height: 100,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontFamily: "inherit",
          }}
        />
      </div>
    </PageLayout>
  );
}

export default SurgeonDashboard;