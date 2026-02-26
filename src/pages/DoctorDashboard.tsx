import PageLayout from "../components/PageLayout";

import incompleteIcon from "../assets/Диаграмма.png";
import preparingIcon from "../assets/Диаграмма (1).png";
import readyIcon from "../assets/Диаграмма (2).png";

function DoctorDashboard() {
  const stats = [
    {
      title: "Всего: Пациенты с неполными данными",
      value: 500,
      color: "#a70b0b",
      icon: incompleteIcon,
    },
    {
      title: "Всего: Пациенты на подготовке",
      value: 340,
      color: "#d0d31c",
      icon: preparingIcon,
    },
    {
      title: "Всего: Пациенты готовые к операции",
      value: 102,
      color: "#3ea515",
      icon: readyIcon,
    },
  ];

  return (
    <PageLayout fullName="Иванов Петр Сергеевич">
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          minHeight: "120vh",
        }}
      >
        <h1 style={{ marginBottom: 24, color: "#000000" }}>
          Список пациентов:
        </h1>

        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 750,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {stats.map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#EAE8EF",
                  borderRadius: 16,
                  padding: 16,
                  height: 140,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      marginBottom: 8,
                      color: "#000000",
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 600,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </div>
                </div>

                <img
                  src={item.icon}
                  alt=""
                  style={{
                    width: 150,
                    height: 150,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
              </div>
            ))}

          </div>

          <div
            style={{
              width: 500,
              backgroundColor: "#EAE8EF",
              borderRadius: 16,
              padding: 24,
              boxSizing: "border-box",
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
                    marginBottom: 8,
                    color: "#000000",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 600,
                    color: "#000000",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 32,
          }}
        >
          <button
            style={{
              padding: "14px 28px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CFCFCF",
              borderRadius: 12,
              fontSize: 16,
              cursor: "pointer",
              color: "#000000",
            }}
          >
            Добавить пациента
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

export default DoctorDashboard;