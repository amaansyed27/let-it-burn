type HeaderProps = {
  soundEnabled: boolean;
  onToggleSound: () => void;
  compact?: boolean;
};

export function Header({
  soundEnabled,
  onToggleSound,
  compact = false,
}: HeaderProps) {
  return (
    <header className={`site-header ${compact ? "site-header--compact" : ""}`}>
      <button className="brand" type="button" aria-label="Let It Burn home">
        <span className="brand__ember" aria-hidden="true" />
        <span>
          LET IT
          <br />
          BURN
        </span>
      </button>

      <div className="header-meta">
        {!compact && (
          <div className="privacy-mark">
            <span className="privacy-mark__pulse" />
            LOCAL / PRIVATE
          </div>
        )}
        <button
          className="sound-toggle"
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? "Mute ritual sound" : "Enable ritual sound"}
        >
          <span className={`sound-bars ${soundEnabled ? "is-active" : ""}`}>
            <i />
            <i />
            <i />
          </span>
          {soundEnabled ? "SOUND ON" : "SOUND OFF"}
        </button>
      </div>
    </header>
  );
}
