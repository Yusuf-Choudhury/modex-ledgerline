export default function Loading() {
  return (
    <div className="lw-page" aria-busy="true" aria-label="Loading">
      <div className="lw-skel" style={{ width: 220, height: 28, marginBottom: 24 }} />
      <div className="lw-board">
        {[0, 1, 2, 3].map((c) => (
          <div key={c} className="lw-col">
            <div className="lw-skel" style={{ width: 90, height: 14, margin: "4px 4px 14px" }} />
            {[0, 1, 2].slice(0, 3 - (c % 2)).map((i) => <div key={i} className="lw-skel lw-skel-card" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
