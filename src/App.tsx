import { useCallback, useEffect, useMemo, useState } from "react";
import { DestructionStage } from "./components/DestructionStage";
import { FateSelector } from "./components/FateSelector";
import { Header } from "./components/Header";
import { HoldToRelease } from "./components/HoldToRelease";
import { OfferingCard } from "./components/OfferingCard";
import { OfferingForm } from "./components/OfferingForm";
import { ReleaseScreen } from "./components/ReleaseScreen";
import { StepRail } from "./components/StepRail";
import { getRitual } from "./data/rituals";
import { useRitualAudio } from "./hooks/useRitualAudio";
import { createArtifactCanvas } from "./lib/artifact";
import type { AppPhase, Offering, Ritual } from "./types";

function App() {
  const [phase, setPhase] = useState<AppPhase>("offer");
  const [offering, setOffering] = useState<Offering | null>(null);
  const [ritual, setRitual] = useState<Ritual>("burn");
  const [texture, setTexture] = useState<HTMLCanvasElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPreparing, setIsPreparing] = useState(false);
  const { play, stop } = useRitualAudio(soundEnabled);
  const definition = useMemo(() => getRitual(ritual), [ritual]);

  const subject = useMemo(() => {
    if (!offering) return "";
    return offering.kind === "text" ? offering.label : offering.name;
  }, [offering]);

  useEffect(() => {
    return () => {
      if (offering?.kind === "file" && offering.previewUrl) {
        URL.revokeObjectURL(offering.previewUrl);
      }
    };
  }, [offering]);

  useEffect(() => {
    if (!soundEnabled) stop();
  }, [soundEnabled, stop]);

  const chooseOffering = (next: Offering) => {
    setOffering(next);
    setTexture(null);
    setPhase("choose");
  };

  const beginRitual = useCallback(async () => {
    if (!offering || isPreparing) return;
    setIsPreparing(true);
    try {
      const artifact = await createArtifactCanvas(offering);
      setTexture(artifact);
      play(ritual);
      setPhase("ritual");
    } finally {
      setIsPreparing(false);
    }
  }, [isPreparing, offering, play, ritual]);

  const startAgain = () => {
    stop();
    setOffering(null);
    setTexture(null);
    setRitual("burn");
    setPhase("offer");
  };

  if (phase === "ritual" && texture && offering) {
    return (
      <div className="app-shell app-shell--ritual">
        <Header
          compact
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((value) => !value)}
        />
        <DestructionStage
          texture={texture}
          ritual={ritual}
          subject={subject}
          onComplete={() => {
            stop();
            setPhase("released");
          }}
        />
      </div>
    );
  }

  if (phase === "released" && offering) {
    return (
      <div className="app-shell app-shell--released">
        <ReleaseScreen
          offering={offering}
          ritual={ritual}
          onAgain={startAgain}
        />
      </div>
    );
  }

  return (
    <div className={`app-shell app-shell--${phase}`}>
      <div className="noise-layer" />
      <div className="ambient-glow" />
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((value) => !value)}
      />
      <StepRail phase={phase} />

      {phase === "offer" ? (
        <main className="offer-layout">
          <section className="offer-intro">
            <div className="eyebrow">
              <span>01</span>
              A DIGITAL RELEASE RITUAL
            </div>
            <h1 id="offering-title">
              Put it here.
              <br />
              <em>Leave without it.</em>
            </h1>
            <p>
              Type the thing, bring the file, name the weight. Then watch it
              become something that can no longer bother you.
            </p>
            <div className="privacy-note">
              <span className="privacy-note__lock" aria-hidden="true">
                ·
              </span>
              <p>
                <strong>Your device. Your ritual.</strong>
                Files are rendered locally and disappear when you leave.
              </p>
            </div>
          </section>
          <OfferingForm onContinue={chooseOffering} />
        </main>
      ) : (
        <main className="choose-layout">
          <section className="choose-preview">
            <div className="eyebrow">
              <span>02</span>
              YOUR OFFERING
            </div>
            {offering && <OfferingCard offering={offering} />}
            <button
              className="back-button"
              type="button"
              onClick={() => setPhase("offer")}
            >
              ← Change the offering
            </button>
          </section>

          <section className="choose-fate">
            <div className="choose-fate__heading">
              <div className="eyebrow">
                <span>03</span>
                CHOOSE ITS FATE
              </div>
              <h1>How should it end?</h1>
            </div>
            <FateSelector value={ritual} onChange={setRitual} />
            <HoldToRelease
              label={isPreparing ? "prepare" : definition.verb}
              onComplete={beginRitual}
            />
            <p className="hold-hint">
              Press and hold. This only destroys the temporary copy.
            </p>
          </section>
        </main>
      )}

      <footer className="site-footer">
        <span>LET IT BURN / {new Date().getFullYear()}</span>
        <span>NO ACCOUNT · NO CLOUD · NO MEMORY</span>
      </footer>
    </div>
  );
}

export default App;
