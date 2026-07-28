import type { AppPhase } from "../types";

const steps = [
  { id: "offer", label: "Offer" },
  { id: "choose", label: "Choose" },
  { id: "ritual", label: "Release" },
] as const;

export function StepRail({ phase }: { phase: AppPhase }) {
  const activeIndex =
    phase === "released"
      ? steps.length
      : steps.findIndex((step) => step.id === phase);

  return (
    <nav className="step-rail" aria-label="Release progress">
      {steps.map((step, index) => (
        <div
          className={`step-rail__item ${
            index === activeIndex ? "is-active" : ""
          } ${index < activeIndex ? "is-complete" : ""}`}
          key={step.id}
        >
          <span>0{index + 1}</span>
          <b>{step.label}</b>
        </div>
      ))}
    </nav>
  );
}
