import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";

interface ControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  area: "up" | "right" | "down" | "left";
  label: string;
  hint: string;
  children: ReactNode;
}

function ControlButton({ area, label, hint, children, ...props }: ControlButtonProps) {
  return (
    <button
      type="button"
      className={`control-button control-${area}`}
      aria-label={label}
      {...props}
    >
      <span className="control-icon">{children}</span>
      <span className="control-hint">{hint}</span>
    </button>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "right" | "down" | "left" }) {
  const rotation = {
    up: "0deg",
    right: "90deg",
    down: "180deg",
    left: "270deg",
  } as const;

  return (
    <svg
      aria-hidden="true"
      className="arrow-icon"
      style={{ transform: `rotate(${rotation[direction]})` }}
      viewBox="0 0 24 24"
    >
      <path
        d="M12 4.5 18.5 11l-1.4 1.4-4.1-4.1V19.5h-2V8.3l-4.1 4.1L5.5 11 12 4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Controls() {
  const move = useGameStore((state) => state.move);
  const won = useGameStore((state) => state.won);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat) {
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          move(0, -1);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          move(1, 0);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          move(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          move(-1, 0);
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  return (
    <section className="controls-panel" aria-label="Movement controls">
      <div className="controls-header">
        <span>Movement</span>
        <small>{won ? "Clear" : "Tap or swipe"}</small>
      </div>

      <div className="dpad-shell">
        <ControlButton area="up" label="Move Up" hint="W" onClick={() => move(0, -1)}>
          <ArrowIcon direction="up" />
        </ControlButton>
        <ControlButton area="left" label="Move Left" hint="A" onClick={() => move(-1, 0)}>
          <ArrowIcon direction="left" />
        </ControlButton>
        <div className="dpad-core" aria-hidden="true">
          <span />
        </div>
        <ControlButton area="right" label="Move Right" hint="D" onClick={() => move(1, 0)}>
          <ArrowIcon direction="right" />
        </ControlButton>
        <ControlButton area="down" label="Move Down" hint="S" onClick={() => move(0, 1)}>
          <ArrowIcon direction="down" />
        </ControlButton>
      </div>
    </section>
  );
}
