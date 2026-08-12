interface PosterQuickRefProps {
  title: string;
  rows: { need: string; answer: string }[];
}

export default function PosterQuickRef({ title, rows }: PosterQuickRefProps) {
  return (
    <div className="poster-wide">
      <h3>{title}</h3>
      <div className="poster-wide-grid">
        {rows.map((row) => (
          <div className="poster-wide-row" key={row.need}>
            <span className="need">{row.need}</span>
            <span className="ans">{row.answer}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
