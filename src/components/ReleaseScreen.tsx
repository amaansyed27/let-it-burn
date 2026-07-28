import { getRitual } from "../data/rituals";
import { downloadReleaseReceipt } from "../lib/artifact";
import type { Offering, Ritual } from "../types";

type ReleaseScreenProps = {
  offering: Offering;
  ritual: Ritual;
  onAgain: () => void;
};

export function ReleaseScreen({
  offering,
  ritual,
  onAgain,
}: ReleaseScreenProps) {
  const definition = getRitual(ritual);

  return (
    <main className="release-screen">
      <div className="release-orbit release-orbit--one" />
      <div className="release-orbit release-orbit--two" />
      <div className="release-screen__content">
        <span className="release-screen__eyebrow">RELEASE CONFIRMED</span>
        <div className="release-screen__ember" aria-hidden="true" />
        <h1>{definition.result}</h1>
        <p>
          Nothing was uploaded. Nothing was stored.
          <br />
          You can leave this here.
        </p>
        <div className="release-actions">
          <button className="primary-action" type="button" onClick={onAgain}>
            Let go of something else
            <span>↗</span>
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() =>
              downloadReleaseReceipt(
                offering,
                definition.result,
                definition.name,
              )
            }
          >
            Save the release
            <span>↓</span>
          </button>
        </div>
      </div>
      <div className="release-screen__footer">
        <span>LET IT BURN / {new Date().getFullYear()}</span>
        <span>YOU MAY CLOSE THIS WINDOW</span>
      </div>
    </main>
  );
}
