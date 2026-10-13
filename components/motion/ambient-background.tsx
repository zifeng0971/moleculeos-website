// Fixed page-wide light: drifting aurora over a fine grain. Pure CSS, so it never touches the main thread.
export function AmbientBackground() {
  return <div className="ambient-bg" aria-hidden="true">
    <div className="ambient-aurora ambient-aurora-a" />
    <div className="ambient-aurora ambient-aurora-b" />
    <div className="ambient-aurora ambient-aurora-c" />
    <div className="ambient-noise" />
  </div>;
}
