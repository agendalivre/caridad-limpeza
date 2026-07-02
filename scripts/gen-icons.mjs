// Genera los íconos PWA. Dos sets:
//  - Cliente (landing): fondo esmeralda + destello (sparkle).
//  - Painel (Caridad): fondo oscuro (ink) + calendario/agenda.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public", { recursive: true });

const svgCliente = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="5.2" fill="#0b6b53"/>
  <g fill="#f5f2ea">
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>
    <path d="M18.4 14.8l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/>
  </g>
</svg>`;

const svgPainel = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="5.2" fill="#17150f"/>
  <g fill="none" stroke="#f5f2ea" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="6.5" width="14" height="13" rx="2.2"/>
    <path d="M5 10.5h14M9 4.6v3.2M15 4.6v3.2"/>
  </g>
  <circle cx="9.4" cy="14" r="1.35" fill="#0f8a68"/>
</svg>`;

const sets = [
  { svg: svgCliente, prefix: "icon" },
  { svg: svgPainel, prefix: "icon-painel" },
];

const sizes = [
  ["-192.png", 192],
  ["-512.png", 512],
];

for (const { svg, prefix } of sets) {
  const buf = Buffer.from(svg);
  for (const [suffix, size] of sizes) {
    const file = `public/${prefix}${suffix}`;
    await sharp(buf, { density: 512 }).resize(size, size).png().toFile(file);
    console.log("wrote", file);
  }
}

// apple-touch-icons (180px)
await sharp(Buffer.from(svgCliente), { density: 512 }).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(Buffer.from(svgPainel), { density: 512 }).resize(180, 180).png().toFile("public/apple-touch-icon-painel.png");
console.log("wrote apple-touch icons");
