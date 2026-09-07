import type { CSSProperties } from "react";

import type { Rotation, TileType } from "../game/types";

import type { TileConnectionStatus } from "../game/connections";

type TileProps = {
  type: TileType;

  rotation: Rotation;

  connected: boolean;

  flowing: boolean;

  flowDelayMs: number;

  connectionStatus: TileConnectionStatus;

  onClick: () => void;
};

function PipeShape({ type }: { type: TileType }) {
  const commonProps = {
    stroke: "currentColor",

    strokeWidth: 18,

    strokeLinecap: "round" as const,

    fill: "none",
  };

  switch (type) {
    case "straight":
      return <line x1="50" y1="0" x2="50" y2="100" {...commonProps} />;

    case "corner":
      return (
        <>
          <line x1="50" y1="50" x2="50" y2="0" {...commonProps} />

          <line x1="50" y1="50" x2="100" y2="50" {...commonProps} />
        </>
      );

    case "tee":
      return (
        <>
          <line x1="50" y1="50" x2="50" y2="0" {...commonProps} />

          <line x1="50" y1="50" x2="0" y2="50" {...commonProps} />

          <line x1="50" y1="50" x2="100" y2="50" {...commonProps} />
        </>
      );

    case "cross":
      return (
        <>
          <line x1="50" y1="0" x2="50" y2="100" {...commonProps} />

          <line x1="0" y1="50" x2="100" y2="50" {...commonProps} />
        </>
      );

    case "end":
      return (
        <>
          <line x1="50" y1="50" x2="50" y2="0" {...commonProps} />

          <circle cx="50" cy="50" r="10" fill="currentColor" />
        </>
      );
  }
}

export default function Tile({
  type,
  rotation,
  connected,
  flowing,
  flowDelayMs,
  connectionStatus,
  onClick,
}: TileProps) {
  return (
    <button
      className={[
        "tile",

        connectionStatus === "complete" ? "tile-complete" : "tile-broken",

        connected ? "tile-connected" : "",

        flowing && connected ? "tile-flowing" : "",
      ].join(" ")}
      style={
        {
          "--flow-delay": `${flowDelayMs}ms`,
        } as CSSProperties
      }
      onClick={onClick}
    >
      <svg
        className="pipe-svg"
        viewBox="0 0 100 100"
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
        aria-hidden="true"
      >
        <PipeShape type={type} />
      </svg>
    </button>
  );
}
