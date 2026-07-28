import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import type { Offering } from "../types";
import { formatBytes, truncateMiddle } from "../lib/format";

type OfferingFormProps = {
  onContinue: (offering: Offering) => void;
};

const MAX_FILE_SIZE = 30 * 1024 * 1024;

export function OfferingForm({ onContinue }: OfferingFormProps) {
  const [tab, setTab] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [label, setLabel] = useState("What I am done carrying");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (nextFile.size > MAX_FILE_SIZE) {
      setError("Keep it under 30 MB. Heavy enough already.");
      return;
    }
    setFile(nextFile);
    setError("");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const submit = () => {
    if (tab === "text") {
      if (!text.trim()) {
        setError("Give the fire something to work with.");
        return;
      }
      onContinue({
        kind: "text",
        text: text.trim(),
        label: label.trim() || "Untitled weight",
      });
      return;
    }

    if (!file) {
      setError("Choose something to let go of.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    onContinue({
      kind: "file",
      file,
      name: file.name,
      size: file.size,
      mime: file.type,
      previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    });
  };

  return (
    <section className="offering-panel" aria-labelledby="offering-title">
      <div className="offering-tabs" role="tablist" aria-label="Offering type">
        <button
          className={tab === "text" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={tab === "text"}
          onClick={() => {
            setTab("text");
            setError("");
          }}
        >
          Write it down
        </button>
        <button
          className={tab === "file" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={tab === "file"}
          onClick={() => {
            setTab("file");
            setError("");
          }}
        >
          Bring a file
        </button>
      </div>

      {tab === "text" ? (
        <div className="write-offering" role="tabpanel">
          <label className="field-label" htmlFor="offering-label">
            Name this weight
          </label>
          <input
            id="offering-label"
            value={label}
            maxLength={56}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="The thing I am done with"
          />
          <label className="field-label" htmlFor="offering-text">
            Put it into words
          </label>
          <div className="textarea-wrap">
            <textarea
              id="offering-text"
              value={text}
              maxLength={520}
              onChange={(event) => {
                setText(event.target.value);
                setError("");
              }}
              placeholder="The email. The deadline. Their name. That one bug..."
              autoFocus
            />
            <span>{text.length} / 520</span>
          </div>
        </div>
      ) : (
        <div
          className={`drop-zone ${isDragging ? "is-dragging" : ""} ${
            file ? "has-file" : ""
          }`}
          role="tabpanel"
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            tabIndex={-1}
            aria-hidden="true"
          />
          <div className="drop-zone__seal" aria-hidden="true">
            {file ? "×" : "+"}
          </div>
          {file ? (
            <>
              <strong>{truncateMiddle(file.name)}</strong>
              <span>
                {file.type || "unknown type"} / {formatBytes(file.size)}
              </span>
              <button
                type="button"
                className="text-button"
                onClick={() => inputRef.current?.click()}
              >
                Choose something else
              </button>
            </>
          ) : (
            <>
              <strong>Drop it into the chamber</strong>
              <span>Any file / up to 30 MB / never uploaded</span>
              <button
                type="button"
                className="text-button"
                onClick={() => inputRef.current?.click()}
              >
                Browse your device
              </button>
            </>
          )}
        </div>
      )}

      <div className="offering-panel__footer">
        <div className={`form-error ${error ? "is-visible" : ""}`} role="alert">
          {error || "Everything stays on this device."}
        </div>
        <button className="continue-button" type="button" onClick={submit}>
          Choose its fate
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
