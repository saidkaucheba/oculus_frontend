type Status = "red" | "yellow" | "green";

interface Props {
  name: string;
  status: Status;
}

const statusColor = {
  red: "red",
  yellow: "orange",
  green: "green",
};

function PatientCard({ name, status }: Props) {
  return (
    <div style={{
      border: "1px solid gray",
      padding: 16,
      marginBottom: 12
    }}>
      <h3>{name}</h3>
      <span style={{ color: statusColor[status] }}>
        Статус: {status}
      </span>
    </div>
  );
}

export default PatientCard;