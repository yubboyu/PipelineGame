type TimerProps = {
  elapsedMs: number;
};

function formatTime(ms: number) {
  const totalTenths = Math.floor(ms / 100);

  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${tenths}`;
}

export default function Timer({ elapsedMs }: TimerProps) {
  return <div className="timer">{formatTime(elapsedMs)}</div>;
}
