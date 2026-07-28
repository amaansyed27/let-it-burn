import type { Offering } from "../types";
import { formatBytes } from "./format";

const WIDTH = 1200;
const HEIGHT = 780;

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.closePath();
}

function fitLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?]?$/, "")}…`;
  }
  return lines;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

export async function createArtifactCanvas(offering: Offering) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported in this browser.");

  const paper = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  paper.addColorStop(0, "#e8e0d2");
  paper.addColorStop(0.55, "#d7ccbb");
  paper.addColorStop(1, "#bfb3a2");
  context.fillStyle = paper;
  roundedRect(context, 0, 0, WIDTH, HEIGHT, 24);
  context.fill();

  context.fillStyle = "rgba(30, 25, 20, 0.04)";
  for (let index = 0; index < 2600; index += 1) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    context.fillRect(x, y, Math.random() * 2, Math.random() * 2);
  }

  context.fillStyle = "#17130f";
  context.font = "600 18px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText("OFFERING / PRIVATE", 74, 72);
  context.fillStyle = "rgba(23, 19, 15, 0.45)";
  context.fillText(new Date().toISOString().slice(0, 10), 946, 72);
  context.fillStyle = "rgba(23, 19, 15, 0.18)";
  context.fillRect(74, 105, WIDTH - 148, 2);

  if (offering.kind === "file" && offering.previewUrl) {
    try {
      const image = await loadImage(offering.previewUrl);
      context.save();
      roundedRect(context, 74, 145, WIDTH - 148, 490, 10);
      context.clip();
      drawImageCover(context, image, 74, 145, WIDTH - 148, 490);
      const shade = context.createLinearGradient(0, 420, 0, 640);
      shade.addColorStop(0, "rgba(0,0,0,0)");
      shade.addColorStop(1, "rgba(0,0,0,0.52)");
      context.fillStyle = shade;
      context.fillRect(74, 145, WIDTH - 148, 490);
      context.restore();
      context.fillStyle = "#f1eadf";
      context.font = "700 32px Arial, sans-serif";
      context.fillText(offering.name, 104, 592, WIDTH - 208);
    } catch {
      drawFileCard(context, offering.name, offering.mime, offering.size);
    }
  } else if (offering.kind === "file") {
    drawFileCard(context, offering.name, offering.mime, offering.size);
  } else {
    context.fillStyle = "#211b15";
    context.font = "500 56px Georgia, 'Times New Roman', serif";
    const lines = fitLines(context, offering.text, WIDTH - 180, 7);
    const lineHeight = 76;
    const contentHeight = lines.length * lineHeight;
    const startY = 170 + Math.max(0, (390 - contentHeight) / 2);
    lines.forEach((line, index) => {
      context.fillText(line, 90, startY + index * lineHeight, WIDTH - 180);
    });
    context.fillStyle = "rgba(33, 27, 21, 0.45)";
    context.font = "600 18px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText(offering.label.toUpperCase(), 90, 670);
  }

  context.fillStyle = "rgba(23, 19, 15, 0.18)";
  context.fillRect(74, 706, WIDTH - 148, 2);
  context.fillStyle = "rgba(23, 19, 15, 0.5)";
  context.font = "500 15px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText("THIS COPY EXISTS ONLY IN YOUR BROWSER", 74, 744);

  return canvas;
}

function drawFileCard(
  context: CanvasRenderingContext2D,
  name: string,
  mime: string,
  size: number,
) {
  context.fillStyle = "#1d1813";
  roundedRect(context, 74, 154, 1052, 460, 10);
  context.fill();
  context.strokeStyle = "rgba(235, 223, 205, 0.18)";
  context.lineWidth = 2;
  context.setLineDash([10, 12]);
  roundedRect(context, 100, 180, 1000, 408, 6);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = "#f05a28";
  context.font = "700 86px Arial, sans-serif";
  const extension = name.includes(".")
    ? name.split(".").pop()?.slice(0, 5).toUpperCase()
    : "FILE";
  context.fillText(extension || "FILE", 136, 310);
  context.fillStyle = "#ede3d4";
  context.font = "600 38px Arial, sans-serif";
  const displayName = name.length > 38 ? `${name.slice(0, 35)}…` : name;
  context.fillText(displayName, 136, 400, 900);
  context.fillStyle = "rgba(237, 227, 212, 0.5)";
  context.font = "500 18px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText(`${mime || "UNKNOWN TYPE"}  /  ${formatBytes(size)}`, 136, 458);
}

export function downloadReleaseReceipt(
  offering: Offering,
  result: string,
  ritualName: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const context = canvas.getContext("2d");
  if (!context) return;

  const gradient = context.createRadialGradient(800, 580, 0, 800, 580, 800);
  gradient.addColorStop(0, "#2d130b");
  gradient.addColorStop(0.45, "#120b08");
  gradient.addColorStop(1, "#070605");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#ef5526";
  context.beginPath();
  context.arc(800, 495, 5, 0, Math.PI * 2);
  context.fill();

  context.textAlign = "center";
  context.fillStyle = "#f0e8dc";
  context.font = "700 92px Georgia, 'Times New Roman', serif";
  context.fillText(result, 800, 420);
  context.fillStyle = "rgba(240, 232, 220, 0.5)";
  context.font = "500 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  const subject = offering.kind === "text" ? offering.label : offering.name;
  context.fillText(`${ritualName.toUpperCase()} / ${subject.toUpperCase()}`, 800, 548);

  context.fillStyle = "rgba(240, 232, 220, 0.24)";
  context.fillRect(590, 646, 420, 1);
  context.fillStyle = "rgba(240, 232, 220, 0.44)";
  context.font = "500 16px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText("LET IT BURN  —  RELEASE CONFIRMED", 800, 708);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `let-it-burn-${Date.now()}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
