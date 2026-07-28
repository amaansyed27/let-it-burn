import { RITUALS } from "../data/rituals";
import type { Ritual } from "../types";

type FateSelectorProps = {
  value: Ritual;
  onChange: (ritual: Ritual) => void;
};

export function FateSelector({ value, onChange }: FateSelectorProps) {
  return (
    <div className="fate-selector" role="radiogroup" aria-label="Destruction method">
      {RITUALS.map((ritual) => (
        <button
          className={`fate-option ${value === ritual.id ? "is-selected" : ""}`}
          key={ritual.id}
          type="button"
          role="radio"
          aria-checked={value === ritual.id}
          onClick={() => onChange(ritual.id)}
        >
          <span className="fate-option__number">{ritual.number}</span>
          <span className="fate-option__glyph" aria-hidden="true">
            {ritual.glyph}
          </span>
          <span className="fate-option__copy">
            <strong>{ritual.name}</strong>
            <small>{ritual.description}</small>
          </span>
          <span className="fate-option__mark" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
