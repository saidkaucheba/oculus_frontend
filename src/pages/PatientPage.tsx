import PageLayout from "../components/PageLayout";

function PatientPage() {
  return (
    <PageLayout fullName="Пациент">
      <h1>Подготовка к операции</h1>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          maxWidth: 500,
        }}
      >
        <p>
          Этап 1: Анализы —{" "}
          <b style={{ color: "green" }}>завершено</b>
        </p>

        <p>
          Этап 2: Проверка —{" "}
          <b style={{ color: "#616161" }}>ожидание</b>
        </p>

        <p style={{ marginTop: 24, fontSize: 18 }}>
          <b>Дата операции:</b> 15 мая
        </p>
      </div>
    </PageLayout>
  );
}

export default PatientPage;