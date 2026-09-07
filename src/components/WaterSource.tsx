type WaterSourceProps = {
  active: boolean;
  flowing: boolean;
};

export function WaterSource({ active, flowing }: WaterSourceProps) {
  return (
    <div
      className={[
        "water-source",
        active ? "water-source-active" : "",
        flowing ? "water-source-flowing" : "",
      ].join(" ")}
    >
      <div className="source-label">WATER</div>

      <div className="source-body">
        <svg
          className="water-drop-svg"
          viewBox="0 0 100 120"
          aria-hidden="true"
        >
          <path
            d="
                M50 5
                C50 5 18 48 18 75
                C18 98 32 113 50 113
                C68 113 82 98 82 75
                C82 48 50 5 50 5
                Z
              "
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="source-connector">
        <svg
          className="source-pipe-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
