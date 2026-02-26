import { useState } from "react";

function IOLCalculator() {
  const [k1, setK1] = useState("");
  const [k2, setK2] = useState("");
  const [acd, setAcd] = useState("");
  const [result, setResult] = useState<number | null>(null);

  function calculate() {
    const value = (Number(k1) + Number(k2)) / 2;
    setResult(value);
  }

  return (
    <div style={{ border: "1px solid gray", padding: 15 }}>
      <h3>Калькулятор ИОЛ</h3>

      <input placeholder="K1" value={k1} onChange={e => setK1(e.target.value)} />
      <br />
      <input placeholder="K2" value={k2} onChange={e => setK2(e.target.value)} />
      <br />
      <input placeholder="ACD" value={acd} onChange={e => setAcd(e.target.value)} />
      <br /><br />

      <button onClick={calculate}>Рассчитать</button>

      {result && <h2>Результат: {result} D</h2>}
    </div>
  );
}

export default IOLCalculator;