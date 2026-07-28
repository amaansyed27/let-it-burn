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
  burn: 9000,
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

type BurnPoint = {
  x: number;
  y: number;
};

const burnSurfaces = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

function getBurnSurface(
  texture: HTMLCanvasElement,
  width: number,
  height: number,
) {
  let surface = burnSurfaces.get(texture);
  if (!surface) {
    surface = document.createElement("canvas");
    burnSurfaces.set(texture, surface);
  }
  const nextWidth = Math.max(1, Math.round(width));
  const nextHeight = Math.max(1, Math.round(height));
  if (surface.width !== nextWidth || surface.height !== nextHeight) {
    surface.width = nextWidth;
    surface.height = nextHeight;
  }
  return surface;
}

function buildBurnFront(
  width: number,
  height: number,
  burn: number,
  elapsed: number,
) {
  const points: BurnPoint[] = [];
  const samples = 48;
  const base = height * (1 - burn);
  const turbulence = Math.sin(clamp(burn) * Math.PI);

  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples;
    const wideWave = Math.sin(ratio * 14.2 + elapsed / 1180) * 7;
    const tightWave = Math.sin(ratio * 41.7 - elapsed / 760) * 3.5;
    const grain = (random(index, 72) - 0.5) * 18;
    let burntBites = 0;
    for (let notch = 0; notch < 7; notch += 1) {
      const notchCenter = random(notch, 126);
      const notchWidth = 0.018 + random(notch, 127) * 0.052;
      const distance = (ratio - notchCenter) / notchWidth;
      burntBites -=
        Math.exp(-(distance * distance)) * (9 + random(notch, 128) * 28);
    }
    points.push({
      x: ratio * width,
      y: clamp(
        base +
          (wideWave + tightWave + grain + burntBites) *
            (0.42 + turbulence * 0.58),
        -16,
        height + 18,
      ),
    });
  }
  return points;
}

function traceBurnFront(
  context: CanvasRenderingContext2D,
  points: BurnPoint[],
) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const middleX = (previous.x + current.x) / 2;
    const middleY = (previous.y + current.y) / 2;
    context.quadraticCurveTo(previous.x, previous.y, middleX, middleY);
  }
  const last = points[points.length - 1];
  context.lineTo(last.x, last.y);
}

function traceRemainingPaper(
  context: CanvasRenderingContext2D,
  points: BurnPoint[],
  width: number,
) {
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(width, 0);
  for (let index = points.length - 1; index >= 0; index -= 1) {
    context.lineTo(points[index].x, points[index].y);
  }
  context.closePath();
}

function drawBurnHole(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  seed: number,
) {
  context.beginPath();
  for (let point = 0; point <= 16; point += 1) {
    const angle = (point / 16) * Math.PI * 2;
    const wobble = 0.72 + random(seed * 20 + point, 73) * 0.42;
    const x = centerX + Math.cos(angle) * radius * wobble;
    const y = centerY + Math.sin(angle) * radius * wobble;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function renderBurningPaper(
  scene: Scene,
  points: BurnPoint[],
  burn: number,
) {
  const { texture, imageWidth, imageHeight } = scene;
  const surface = getBurnSurface(texture, imageWidth, imageHeight);
  const surfaceContext = surface.getContext("2d");
  if (!surfaceContext) return surface;

  surfaceContext.clearRect(0, 0, surface.width, surface.height);
  surfaceContext.globalCompositeOperation = "source-over";
  surfaceContext.filter = "none";
  surfaceContext.drawImage(texture, 0, 0, imageWidth, imageHeight);

  surfaceContext.globalCompositeOperation = "destination-in";
  surfaceContext.fillStyle = "#fff";
  traceRemainingPaper(surfaceContext, points, imageWidth);
  surfaceContext.fill();

  surfaceContext.globalCompositeOperation = "source-atop";
  surfaceContext.save();
  surfaceContext.filter = "blur(8px)";
  traceBurnFront(surfaceContext, points);
  surfaceContext.strokeStyle = "rgba(62, 37, 23, 0.42)";
  surfaceContext.lineWidth = 34;
  surfaceContext.stroke();
  surfaceContext.restore();

  traceBurnFront(surfaceContext, points);
  surfaceContext.strokeStyle = "rgba(35, 18, 9, 0.78)";
  surfaceContext.lineWidth = 18;
  surfaceContext.stroke();

  traceBurnFront(surfaceContext, points);
  surfaceContext.strokeStyle = "rgba(6, 4, 3, 0.98)";
  surfaceContext.lineWidth = 7;
  surfaceContext.stroke();

  for (let index = 0; index < 70; index += 1) {
    const point = points[Math.floor(random(index, 129) * (points.length - 1))];
    const size = 0.8 + random(index, 130) * 3.2;
    surfaceContext.fillStyle = `rgba(28, 13, 7, ${
      0.08 + random(index, 131) * 0.24
    })`;
    surfaceContext.beginPath();
    surfaceContext.arc(
      point.x + (random(index, 132) - 0.5) * 24,
      point.y - 5 - random(index, 133) * 25,
      size,
      0,
      Math.PI * 2,
    );
    surfaceContext.fill();
  }

  for (let index = 0; index < 32; index += 1) {
    const ignition = 0.08 + random(index, 74) * 0.78;
    const life = clamp((burn - ignition) / 0.13);
    if (life <= 0) continue;

    const centerX = random(index, 75) * imageWidth;
    const centerY =
      imageHeight * (1 - ignition) -
      8 -
      random(index, 76) * Math.min(72, imageHeight * 0.12);
    const outerRadius = (6 + random(index, 77) * 25) * easeOut(life);

    surfaceContext.globalCompositeOperation = "source-atop";
    surfaceContext.fillStyle = `rgba(8, 5, 3, ${0.82 * life})`;
    drawBurnHole(
      surfaceContext,
      centerX,
      centerY,
      outerRadius + 7,
      index,
    );
    surfaceContext.fill();

    surfaceContext.globalCompositeOperation = "destination-out";
    surfaceContext.fillStyle = "#000";
    drawBurnHole(surfaceContext, centerX, centerY, outerRadius, index);
    surfaceContext.fill();
  }

  surfaceContext.globalCompositeOperation = "source-over";
  return surface;
}

function drawSmoke(
  context: CanvasRenderingContext2D,
  x: number,
  points: BurnPoint[],
  burn: number,
  elapsed: number,
) {
  const amount = Math.sin(clamp(burn) * Math.PI * 0.88);
  if (amount <= 0.02) return;

  context.save();
  context.filter = "blur(9px)";
  for (let index = 0; index < 24; index += 1) {
    const cycle =
      (elapsed / (2500 + random(index, 81) * 1800) + random(index, 82)) % 1;
    const point = points[Math.floor(random(index, 83) * (points.length - 1))];
    const drift =
      (random(index, 84) - 0.5) * 90 * cycle +
      Math.sin(elapsed / 900 + index) * 15;
    const radius = 9 + cycle * (32 + random(index, 85) * 34);
    context.globalAlpha =
      Math.sin(cycle * Math.PI) * (0.035 + random(index, 86) * 0.065) * amount;
    context.fillStyle = index % 3 === 0 ? "#a37963" : "#77716c";
    context.beginPath();
    context.ellipse(
      x + point.x + drift,
      point.y - cycle * (110 + random(index, 87) * 190),
      radius * 0.8,
      radius,
      drift / 180,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
}

function drawFlames(
  context: CanvasRenderingContext2D,
  x: number,
  points: BurnPoint[],
  burn: number,
  elapsed: number,
) {
  const strength = Math.sin(clamp(burn * 1.1) * Math.PI);
  if (strength <= 0.02) return;

  context.save();
  context.globalCompositeOperation = "lighter";
  for (let index = 0; index < 42; index += 1) {
    const point = points[Math.floor(random(index, 90) * (points.length - 1))];
    const cycle =
      (elapsed / (360 + random(index, 91) * 520) + random(index, 92)) % 1;
    const baseX = x + point.x + Math.sin(elapsed / 230 + index * 2.1) * 3.5;
    const height = (7 + random(index, 93) * 34) * (1 - cycle * 0.42);
    const width = 2 + random(index, 94) * 7;
    const sway = Math.sin(elapsed / 320 + index * 1.7) * height * 0.3;
    const alpha = Math.sin(cycle * Math.PI) * strength;

    const flame = context.createLinearGradient(
      0,
      point.y,
      0,
      point.y - height,
    );
    flame.addColorStop(0, `rgba(255, 146, 62, ${0.88 * alpha})`);
    flame.addColorStop(0.24, `rgba(255, 76, 22, ${0.76 * alpha})`);
    flame.addColorStop(0.65, `rgba(205, 30, 9, ${0.46 * alpha})`);
    flame.addColorStop(1, "rgba(92, 10, 3, 0)");
    context.fillStyle = flame;
    context.shadowColor = "rgba(255, 53, 12, 0.76)";
    context.shadowBlur = 5 + width;
    context.beginPath();
    context.moveTo(baseX - width, point.y + 5);
    context.bezierCurveTo(
      baseX - width * 0.5,
      point.y - height * 0.26,
      baseX + sway - width * 0.12,
      point.y - height * 0.72,
      baseX + sway,
      point.y - height,
    );
    context.bezierCurveTo(
      baseX + sway + width * 0.35,
      point.y - height * 0.56,
      baseX + width * 0.62,
      point.y - height * 0.22,
      baseX + width,
      point.y + 5,
    );
    context.closePath();
    context.fill();
  }
  context.restore();
}

function drawBurnEdge(
  context: CanvasRenderingContext2D,
  x: number,
  points: BurnPoint[],
  burn: number,
) {
  const strength = Math.sin(clamp(burn * 1.08) * Math.PI);
  if (strength <= 0.02) return;
  context.save();
  context.translate(x, 0);
  context.globalCompositeOperation = "lighter";

  traceBurnFront(context, points);
  context.strokeStyle = `rgba(117, 14, 4, ${0.52 * strength})`;
  context.lineWidth = 8;
  context.shadowColor = "rgba(255, 43, 8, 0.7)";
  context.shadowBlur = 17;
  context.stroke();

  traceBurnFront(context, points);
  context.strokeStyle = `rgba(255, 68, 18, ${0.82 * strength})`;
  context.lineWidth = 2.8;
  context.shadowBlur = 9;
  context.stroke();

  traceBurnFront(context, points);
  context.strokeStyle = `rgba(255, 143, 67, ${0.88 * strength})`;
  context.lineWidth = 0.8;
  context.shadowBlur = 4;
  context.stroke();
  context.restore();
}

function drawAsh(
  scene: Scene,
  x: number,
  points: BurnPoint[],
  burn: number,
  elapsed: number,
) {
  const { context, texture, centerX, centerY, imageWidth, imageHeight } = scene;
  const floorY = centerY + imageHeight / 2 + Math.min(64, scene.height * 0.07);
  const pile = easeOut(clamp((burn - 0.08) / 0.92));

  context.save();
  context.globalAlpha = pile * 0.8;
  for (let index = 0; index < 74; index += 1) {
    const spread = (random(index, 101) - 0.5) * imageWidth * 0.78 * pile;
    const layer = random(index, 102);
    const size = 1 + random(index, 103) * 5;
    context.fillStyle =
      index % 5 === 0
        ? "rgba(75, 61, 51, 0.72)"
        : "rgba(38, 34, 31, 0.82)";
    context.beginPath();
    context.ellipse(
      centerX + spread,
      floorY - layer * 9 * pile,
      size * 1.7,
      size * 0.52,
      random(index, 104) * Math.PI,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();

  for (let index = 0; index < 96; index += 1) {
    const delay = 0.04 + random(index, 105) * 0.86;
    const life = clamp((burn - delay) / (0.13 + random(index, 106) * 0.12));
    if (life <= 0 || life >= 1) continue;
    const point = points[Math.floor(random(index, 107) * (points.length - 1))];
    const startX = x + point.x;
    const drift =
      (random(index, 108) - 0.5) * (70 + life * 130) +
      Math.sin(elapsed / 310 + index) * 10;
    const y = point.y + life * life * (80 + random(index, 109) * 280);
    const size = 3 + random(index, 110) * 9;

    context.save();
    context.globalAlpha = Math.sin(life * Math.PI) * 0.84;
    context.translate(startX + drift, y);
    context.rotate((random(index, 111) - 0.5) * life * 9);
    context.filter = "grayscale(1) brightness(0.25)";
    const sourceX = random(index, 112) * (texture.width - 24);
    const sourceY = random(index, 113) * (texture.height - 24);
    context.drawImage(
      texture,
      sourceX,
      sourceY,
      24,
      24,
      -size / 2,
      -size / 2,
      size,
      size * (0.35 + random(index, 114) * 0.6),
    );
    context.restore();
  }
}

function drawSparks(
  context: CanvasRenderingContext2D,
  x: number,
  points: BurnPoint[],
  burn: number,
  elapsed: number,
) {
  for (let index = 0; index < 74; index += 1) {
    const delay = random(index, 120) * 0.82;
    const life = clamp((burn - delay) / 0.22);
    if (life <= 0 || life >= 1) continue;
    const point = points[Math.floor(random(index, 121) * (points.length - 1))];
    const sparkX =
      x +
      point.x +
      (random(index, 122) - 0.5) * 80 * life +
      Math.sin(elapsed / 220 + index) * 13;
    const sparkY = point.y - life * (90 + random(index, 123) * 240);
    const alpha = Math.sin(life * Math.PI);
    context.fillStyle = `rgba(255, ${
      110 + Math.round(random(index, 124) * 110)
    }, 38, ${alpha})`;
    context.beginPath();
    context.arc(sparkX, sparkY, 0.7 + random(index, 125) * 1.8, 0, Math.PI * 2);
    context.fill();
  }
}

function drawBurn(scene: Scene, progress: number, elapsed: number) {
  const { context, centerX, centerY, imageWidth, imageHeight } = scene;
  const x = centerX - imageWidth / 2;
  const y = centerY - imageHeight / 2;
  const burn = clamp((progress - 0.035) / 0.84);
  const localPoints = buildBurnFront(imageWidth, imageHeight, burn, elapsed);
  const worldPoints = localPoints.map((point) => ({
    x: point.x,
    y: y + point.y,
  }));
  const fireStrength = Math.sin(clamp(burn * 1.08) * Math.PI);

  drawSmoke(context, x, worldPoints, burn, elapsed);

  if (burn < 1) {
    const burningPaper = renderBurningPaper(scene, localPoints, burn);
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.78)";
    context.shadowBlur = 42;
    context.shadowOffsetY = 26;
    context.drawImage(burningPaper, x, y, imageWidth, imageHeight);
    context.restore();
  }

  if (fireStrength > 0.02) {
    const averageEdge =
      worldPoints.reduce((sum, point) => sum + point.y, 0) / worldPoints.length;
    const glow = context.createRadialGradient(
      centerX,
      averageEdge,
      0,
      centerX,
      averageEdge,
      imageWidth * 0.64,
    );
    glow.addColorStop(0, `rgba(255, 68, 12, ${0.23 * fireStrength})`);
    glow.addColorStop(0.42, `rgba(157, 32, 5, ${0.1 * fireStrength})`);
    glow.addColorStop(1, "rgba(70, 12, 2, 0)");
    context.fillStyle = glow;
    context.fillRect(
      x - imageWidth * 0.18,
      averageEdge - imageHeight * 0.46,
      imageWidth * 1.36,
      imageHeight * 0.92,
    );
  }

  drawFlames(context, x, worldPoints, burn, elapsed);
  drawBurnEdge(context, x, worldPoints, burn);
  drawSparks(context, x, worldPoints, burn, elapsed);
  drawAsh(scene, x, worldPoints, burn, elapsed);
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
