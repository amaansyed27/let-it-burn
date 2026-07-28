import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type HoldToReleaseProps = {
  label: string;
  onComplete: () => void;
};

const HOLD_DURATION = 1100;

export function HoldToRelease({ label, onComplete }: HoldToReleaseProps) {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const completedRef = useRef(false);

  const cancel = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    if (!completedRef.current) setProgress(0);
  }, []);

  const begin = useCallback(() => {
    if (frameRef.current !== null) return;
    completedRef.current = false;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const next = Math.min(1, (now - startRef.current) / HOLD_DURATION);
      setProgress(next);
      if (next >= 1) {
        frameRef.current = null;
        completedRef.current = true;
        onComplete();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [onComplete]);

  useEffect(() => cancel, [cancel]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    begin();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      begin();
    }
  };

  return (
    <button
      className="hold-button"
      type="button"
      style={{ "--hold-progress": progress } as CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onKeyDown={handleKeyDown}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") cancel();
      }}
    >
      <span className="hold-button__fill" />
      <span className="hold-button__label">
        <i className="hold-button__ring" />
        Hold to {label}
      </span>
      <span className="hold-button__progress">
        {Math.round(progress * 100)
          .toString()
          .padStart(3, "0")}
      </span>
    </button>
  );
}
