import type { Offering } from "../types";
import { formatBytes, truncateMiddle } from "../lib/format";

export function OfferingCard({ offering }: { offering: Offering }) {
  const hasImage = offering.kind === "file" && offering.previewUrl;

  return (
    <div className="offering-card-wrap">
      <div className={`offering-card ${hasImage ? "offering-card--image" : ""}`}>
        <div className="offering-card__meta">
          <span>OFFERING / PRIVATE</span>
          <span>{new Date().toISOString().slice(0, 10)}</span>
        </div>
        {hasImage ? (
          <div
            className="offering-card__image"
            style={{ backgroundImage: `url("${offering.previewUrl}")` }}
          >
            <strong>{truncateMiddle(offering.name, 46)}</strong>
          </div>
        ) : offering.kind === "file" ? (
          <div className="offering-card__file">
            <b>
              {offering.name.includes(".")
                ? offering.name.split(".").pop()?.toUpperCase()
                : "FILE"}
            </b>
            <strong>{truncateMiddle(offering.name, 42)}</strong>
            <span>
              {offering.mime || "UNKNOWN TYPE"} / {formatBytes(offering.size)}
            </span>
          </div>
        ) : (
          <div className="offering-card__text">
            <blockquote>“{offering.text}”</blockquote>
            <strong>{offering.label}</strong>
          </div>
        )}
        <div className="offering-card__footer">
          This copy exists only in your browser
        </div>
      </div>
      <span className="offering-card-wrap__shadow" />
    </div>
  );
}
