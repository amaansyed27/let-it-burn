import { useEffect, useRef } from "react";
import type { Ritual } from "../types";
import { getRitual } from "../data/rituals";

type DestructionStageProps = {
  texture: HTMLCanvasElement;
  ritual: Ritual;
  subject: string;
  onComplete: () => void;
};

type Scene = {
  context: CanvasRenderingContext2D;
  texture: HTMLCanvasElement;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  imageWidth: number;
  imageHeight: number;
};

const DURATION: Record<Ritual, number> = {
  burn: 6800,
  shatter: 3500,
  shred: 4700,
  dissolve: 5400,
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const easeIn = (value: number) => value ** 3;
const easeOut = (value: number) => 1 - (1 - value) ** 3;

function random(index: number, salt = 1) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function setCanvasSize(canvas: HTMLCanvasElement) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const bounds = canvas.getBoundingClientRect();
  const targetWidth = Math.max(1, Math.round(bounds.width * ratio));
  const targetHeight = Math.max(1, Math.round(bounds.height * ratio));
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return {
    context,
    width: bounds.width,
    height: bounds.height,
  };
}

function makeScene(
  context: CanvasRenderingContext2D,
  texture: HTMLCanvasElement,
  width: number,
  height: number,
): Scene {
  const imageWidth = Math.min(width * (width < 650 ? 0.84 : 0.58), 740);
  const imageHeight = imageWidth * (texture.height / texture.width);
  return {
    context,
    texture,
    width,
    height,
    centerX: width / 2,
    centerY: height / 2 + (width < 650 ? 6 : 20),
    imageWidth,
    imageHeight,
  };
}

function drawAtmosphere(scene: Scene, elapsed: number, intensity: number) {
  const { context, width, height, centerX, centerY } = scene;
  context.clearRect(0, 0, width, height);

  const glow = context.createRadialGradient(
    centerX,
    centerY + 90,
    0,
    centerX,
    centerY + 90,
    Math.max(width, height) * 0.72,
  );
  glow.addColorStop(0, `rgba(178, 47, 11, ${0.13 * intensity})`);
  glow.addColorStop(0.35, `rgba(70, 22, 8, ${0.1 * intensity})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 48; index += 1) {
    const x = random(index, 2) * width;
    const baseY = random(index, 3) * height;
    const speed = 4 + random(index, 4) * 14;
    const y = (baseY - (elapsed / 1000) * speed + height) % height;
    const alpha = (0.06 + random(index, 5) * 0.12) * intensity;
    context.fillStyle = `rgba(236, 107, 47, ${alpha})`;
    context.beginPath();
    context.arc(x, y, 0.5 + random(index, 6) * 1.4, 0, Math.PI * 2);
    context.fill();
  }
}

function drawArtifact(scene: Scene, alpha = 1) {
  const { context, texture, centerX, centerY, imageWidth, imageHeight } = scene;
  context.save();
  context.globalAlpha = alpha;
  context.shadowColor = "rgba(0, 0, 0, 0.62)";
  context.shadowBlur = 40;
  context.shadowOffsetY = 24;
  context.drawImage(
    texture,
    centerX - imageWidth / 2,
    centerY - imageHeight / 2,
    imageWidth,
    imageHeight,
  );
  context.restore();
}

function drawBurn(scene: Scene, progress: number, elapsed: number) {
  const { context, texture, centerX, centerY, imageWidth, imageHeight } = scene;
  const x = centerX - imageWidth / 2;
  const y = centerY - imageHeight / 2;
  const burn = clamp((progress - 0.04) / 0.89);
  const remaining = imageHeight * (1 - burn);
  const sourceHeight = texture.height * (1 - burn);
  const edgeY = y + remaining;

  if (remaining > 1) {
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.62)";
    context.shadowBlur = 38;
    context.shadowOffsetY = 20;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + imageWidth, y);
    for (let index = 12; index >= 0; index -= 1) {
      const pointX = x + (imageWidth * index) / 12;
      const jagged = (random(index, Math.floor(burn * 140)) - 0.5) * 26;
      context.lineTo(pointX, edgeY + jagged);
    }
    context.closePath();
    context.clip();
    context.drawImage(
      texture,
      0,
      0,
      texture.width,
      Math.max(1, sourceHeight),
      x,
      y,
      imageWidth,
      Math.max(1, remaining),
    );

    const char = context.createLinearGradient(0, edgeY - 54, 0, edgeY + 10);
    char.addColorStop(0, "rgba(16, 11, 7, 0)");
    char.addColorStop(0.45, "rgba(20, 10, 5, 0.42)");
    char.addColorStop(0.76, "rgba(14, 6, 3, 0.94)");
    char.addColorStop(0.9, "rgba(240, 69, 19, 0.9)");
    char.addColorStop(1, "rgba(255, 184, 66, 0)");
    context.fillStyle = char;
    context.fillRect(x - 8, edgeY - 62, imageWidth + 16, 80);
    context.restore();
  }

  const sparkCount = 95;
  for (let index = 0; index < sparkCount; index += 1) {
    const delay = random(index, 20) * 0.72;
    const life = clamp((burn - delay) / 0.28);
    if (life <= 0 || life >= 1) continue;
    const startX = x + random(index, 21) * imageWidth;
    const wave = Math.sin(elapsed / 280 + index) * 16;
    const sparkX = startX + (random(index, 22) - 0.5) * 90 * life + wave * life;
    const sparkY = edgeY - life * (90 + random(index, 23) * 230);
    const alpha = Math.sin(life * Math.PI);
    context.fillStyle = `rgba(255, ${
      90 + Math.round(random(index, 24) * 100)
    }, 34, ${alpha})`;
    context.beginPath();
    context.arc(sparkX, sparkY, 0.8 + random(index, 25) * 2, 0, Math.PI * 2);
    context.fill();
  }

  const flameStrength = Math.sin(clamp(burn * 1.4) * Math.PI);
  if (flameStrength > 0.03) {
    const fireGlow = context.createRadialGradient(
      centerX,
      edgeY,
      0,
      centerX,
      edgeY,
      imageWidth * 0.65,
    );
    fireGlow.addColorStop(0, `rgba(255, 71, 18, ${0.2 * flameStrength})`);
    fireGlow.addColorStop(1, "rgba(255, 50, 0, 0)");
    context.fillStyle = fireGlow;
    context.fillRect(
      x - imageWidth * 0.2,
      edgeY - imageHeight * 0.4,
      imageWidth * 1.4,
      imageHeight * 0.8,
    );
  }
}

function drawCracks(scene: Scene, strength: number) {
  const { context, centerX, centerY, imageWidth, imageHeight } = scene;
  context.save();
  context.strokeStyle = `rgba(25, 17, 12, ${0.78 * strength})`;
  context.lineWidth = 1.2;
  for (let branch = 0; branch < 12; branch += 1) {
    const angle = (Math.PI * 2 * branch) / 12 + random(branch, 30) * 0.28;
    const length = (0.28 + random(branch, 31) * 0.42) * imageWidth;
    context.beginPath();
    context.moveTo(centerX, centerY);
    for (let point = 1; point <= 5; point += 1) {
      const distance = (length * point) / 5;
      const jitter = (random(branch * 8 + point, 32) - 0.5) * 24;
      context.lineTo(
        centerX + Math.cos(angle) * distance + jitter,
        centerY +
          Math.sin(angle) * distance * (imageHeight / imageWidth) +
          jitter,
      );
    }
    context.stroke();
  }
  context.restore();
}

function drawShatter(scene: Scene, progress: number) {
  if (progress < 0.18) {
    drawArtifact(scene);
    drawCracks(scene, clamp(progress / 0.13));
    return;
  }

  const {
    context,
    texture,
    centerX,
    centerY,
    imageWidth,
    imageHeight,
    width,
    height,
  } = scene;
  const split = easeIn(clamp((progress - 0.15) / 0.85));
  const columns = 8;
  const rows = 6;
  const cellW = imageWidth / columns;
  const cellH = imageHeight / rows;
  const sourceW = texture.width / columns;
  const sourceH = texture.height / rows;
  const originX = centerX - imageWidth / 2;
  const originY = centerY - imageHeight / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const baseX = originX + column * cellW + cellW / 2;
      const baseY = originY + row * cellH + cellH / 2;
      const direction = Math.atan2(baseY - centerY, baseX - centerX);
      const force = Math.max(width, height) * (0.28 + random(index, 40) * 0.45);
      const x =
        baseX +
        Math.cos(direction) * force * split +
        (random(index, 41) - 0.5) * 120 * split;
      const y =
        baseY +
        Math.sin(direction) * force * split +
        0.5 * 600 * split ** 2;
      const rotation = (random(index, 42) - 0.5) * 6 * split;

      context.save();
      context.globalAlpha = clamp(1 - Math.max(0, split - 0.7) / 0.3);
      context.translate(x, y);
      context.rotate(rotation);
      context.drawImage(
        texture,
        column * sourceW,
        row * sourceH,
        sourceW + 1,
        sourceH + 1,
        -cellW / 2,
        -cellH / 2,
        cellW + 1,
        cellH + 1,
      );
      context.restore();
    }
  }
}

function drawShred(scene: Scene, progress: number) {
  const { context, texture, centerX, centerY, imageWidth, imageHeight, height } =
    scene;
  if (progress < 0.08) {
    drawArtifact(scene);
    return;
  }

  const strips = 28;
  const stripWidth = imageWidth / strips;
  const sourceWidth = texture.width / strips;
  const originX = centerX - imageWidth / 2;
  const originY = centerY - imageHeight / 2;

  for (let index = 0; index < strips; index += 1) {
    const delay = (index % 2 === 0 ? index : strips - index) / strips * 0.28;
    const local = easeIn(clamp((progress - 0.06 - delay) / 0.66));
    const x =
      originX +
      index * stripWidth +
      stripWidth / 2 +
      Math.sin(index * 1.8 + progress * 8) * 20 * local;
    const y =
      originY +
      imageHeight / 2 +
      local * (height - originY + 180) +
      Math.sin(index) * 14 * local;

    context.save();
    context.globalAlpha = clamp(1 - Math.max(0, local - 0.82) / 0.18);
    context.translate(x, y);
    context.rotate((random(index, 50) - 0.5) * local * 1.7);
    context.drawImage(
      texture,
      index * sourceWidth,
      0,
      sourceWidth + 1,
      texture.height,
      -stripWidth / 2,
      -imageHeight / 2,
      stripWidth + 1,
      imageHeight,
    );
    context.restore();
  }

  const bladeY = originY + imageHeight * clamp((progress - 0.03) / 0.3);
  if (progress < 0.37) {
    const bladeGlow = context.createLinearGradient(
      originX,
      0,
      originX + imageWidth,
      0,
    );
    bladeGlow.addColorStop(0, "rgba(238, 81, 31, 0)");
    bladeGlow.addColorStop(0.5, "rgba(238, 81, 31, 0.8)");
    bladeGlow.addColorStop(1, "rgba(238, 81, 31, 0)");
    context.fillStyle = bladeGlow;
    context.fillRect(originX, bladeY - 1, imageWidth, 2);
  }
}

function drawDissolve(scene: Scene, progress: number) {
  const { context, texture, centerX, centerY, imageWidth, imageHeight } = scene;
  if (progress < 0.04) {
    drawArtifact(scene);
    return;
  }

  const rows = 72;
  const stripHeight = imageHeight / rows;
  const sourceHeight = texture.height / rows;
  const originX = centerX - imageWidth / 2;
  const originY = centerY - imageHeight / 2;

  for (let row = 0; row < rows; row += 1) {
    const wave = random(row, 60) * 0.28;
    const local = easeOut(clamp((progress - 0.02 - wave) / 0.68));
    const direction = row % 2 === 0 ? 1 : -1;
    const drift =
      direction *
      local ** 2 *
      (80 + random(row, 61) * imageWidth * 0.75);
    const ripple = Math.sin(row * 0.8 + progress * 12) * local * 18;
    const alpha = clamp(1 - local ** 1.7);
    context.save();
    context.globalAlpha = alpha;
    context.drawImage(
      texture,
      0,
      row * sourceHeight,
      texture.width,
      sourceHeight + 1,
      originX + drift + ripple,
      originY + row * stripHeight,
      imageWidth,
      stripHeight + 1,
    );
    context.restore();

    if (local > 0.25 && local < 0.9 && row % 3 === 0) {
      context.fillStyle = `rgba(230, 102, 48, ${alpha * 0.45})`;
      context.fillRect(
        originX + drift + (direction > 0 ? 0 : imageWidth),
        originY + row * stripHeight,
        direction * (20 + local * 100),
        1,
      );
    }
  }
}

export function DestructionStage({
  texture,
  ritual,
  subject,
  onComplete,
}: DestructionStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const definition = getRitual(ritual);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let start = 0;
    let completed = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 1100 : DURATION[ritual];

    const render = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      const progress = clamp(elapsed / duration);
      const sized = setCanvasSize(canvas);
      if (!sized) return;
      const scene = makeScene(
        sized.context,
        texture,
        sized.width,
        sized.height,
      );
      drawAtmosphere(scene, elapsed, Math.sin(progress * Math.PI) + 0.25);

      if (ritual === "burn") drawBurn(scene, progress, elapsed);
      if (ritual === "shatter") drawShatter(scene, progress);
      if (ritual === "shred") drawShred(scene, progress);
      if (ritual === "dissolve") drawDissolve(scene, progress);

      if (progress >= 1 && !completed) {
        completed = true;
        window.setTimeout(() => completeRef.current(), reduced ? 100 : 450);
        return;
      }
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [ritual, texture]);

  return (
    <section className={`destruction-stage destruction-stage--${ritual}`}>
      <div className="stage-vignette" />
      <canvas ref={canvasRef} aria-label={`${definition.name} animation`} />
      <div className="stage-caption" aria-live="polite">
        <span>{definition.number} / RITUAL IN PROGRESS</span>
        <strong>{definition.name}</strong>
        <small>{subject}</small>
      </div>
      <div className="stage-timecode">
        DO NOT REFRESH
        <span />
      </div>
    </section>
  );
}
