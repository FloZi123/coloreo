export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center" style={{ fontSize: size }} aria-label={`${value} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= full ? "#FFC857" : "#ECE5DB" }}>★</span>
      ))}
    </span>
  );
}
