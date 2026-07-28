import { useCallback, useRef } from "react";
import type { Ritual } from "../types";

type ActiveAudio = {
  context: AudioContext;
  nodes: AudioNode[];
};

export function useRitualAudio(enabled: boolean) {
  const activeRef = useRef<ActiveAudio | null>(null);

  const stop = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    active.nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // The browser may already have released the node.
      }
    });
    void active.context.close();
    activeRef.current = null;
  }, []);

  const play = useCallback(
    (ritual: Ritual) => {
      stop();
      if (!enabled) return;

      const context = new AudioContext();
      const master = context.createGain();
      master.gain.setValueAtTime(0.001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.08);
      master.connect(context.destination);

      const nodes: AudioNode[] = [master];
      const duration =
        ritual === "burn" ? 6.3 : ritual === "dissolve" ? 4.7 : 3.6;

      const buffer = context.createBuffer(
        1,
        context.sampleRate * duration,
        context.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) {
        const envelope = 1 - index / data.length;
        data[index] = (Math.random() * 2 - 1) * envelope;
      }

      const noise = context.createBufferSource();
      noise.buffer = buffer;
      const filter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);
      nodes.push(noise, filter, noiseGain);

      if (ritual === "burn") {
        filter.type = "lowpass";
        filter.frequency.value = 740;
        noiseGain.gain.value = 0.42;
      } else if (ritual === "shatter") {
        filter.type = "highpass";
        filter.frequency.value = 1800;
        noiseGain.gain.setValueAtTime(0.8, context.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + 0.9,
        );
      } else if (ritual === "shred") {
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(260, context.currentTime);
        filter.frequency.linearRampToValueAtTime(
          1200,
          context.currentTime + duration,
        );
        noiseGain.gain.value = 0.34;
      } else {
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2100, context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(
          90,
          context.currentTime + duration,
        );
        noiseGain.gain.value = 0.24;
      }

      const tone = context.createOscillator();
      const toneGain = context.createGain();
      tone.type = ritual === "shatter" ? "square" : "sine";
      tone.frequency.setValueAtTime(
        ritual === "burn" ? 52 : ritual === "dissolve" ? 180 : 84,
        context.currentTime,
      );
      tone.frequency.exponentialRampToValueAtTime(
        ritual === "dissolve" ? 36 : 28,
        context.currentTime + duration,
      );
      toneGain.gain.setValueAtTime(0.12, context.currentTime);
      toneGain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration,
      );
      tone.connect(toneGain);
      toneGain.connect(master);
      nodes.push(tone, toneGain);

      noise.start();
      tone.start();
      noise.stop(context.currentTime + duration);
      tone.stop(context.currentTime + duration);
      master.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration,
      );
      activeRef.current = { context, nodes };
    },
    [enabled, stop],
  );

  return { play, stop };
}
