import PageLayout from "../components/PageLayout";

function DoctorDashboard() {
  return (
    <PageLayout fullName="Иванов Петр Сергеевич">
      {/* ОСНОВНОЙ БЕЛЫЙ КОНТЕЙНЕР */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        {/* ЛЕВАЯ ЧАСТЬ */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1 style={{ marginBottom: 24 }}>Список пациентов</h1>

          {/* КАРТОЧКИ СТАТИСТИКИ */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                title: "Всего: Пациенты с неполными данными",
                value: 500,
              },
              {
                title: "Всего: Пациенты на подготовке",
                value: 340,
              },
              {
                title: "Всего: Пациенты готовые к операции",
                value: 102,
              },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#EAE8EF",
                  borderRadius: 16,
                  padding: 16,
                  flex: "1 1 180px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#616161",
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 600,
                    }}
                  >
                    {item.value}
                  </div>
                </div>

                {/* Заглушка под фото */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: "#CFCFCF",
                    borderRadius: 12,
                  }}
                />
              </div>
            ))}
          </div>

          {/* КНОПКА */}
          <button
            style={{
              padding: "12px 24px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CFCFCF",
              borderRadius: 12,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Добавить пациента
          </button>
        </div>

        {/* ПРАВАЯ ЧАСТЬ */}
        <div
          style={{
            backgroundColor: "#EAE8EF",
            borderRadius: 16,
            padding: 24,
            minWidth: 240,
            flexShrink: 0,
          }}
        >
          {[
            { title: "Всего:", value: 942 },
            { title: "Свободные даты:", value: 23 },
            { title: "Свободные хирурги:", value: 4 },
          ].map((item, index) => (
            <div key={index} style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 16,
                  color: "#616161",
                  marginBottom: 8,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 600,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

export default DoctorDashboard;