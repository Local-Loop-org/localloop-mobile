// scripts/generate-icons.js — generates all app icon PNG assets from icon 12 (Loop Mark)
// Run: node scripts/generate-icons.js
//
// Icon 12 "Loop Mark (oo)" from icons-cyan.jsx:
//   SVG viewport 512×512, bg #0A0A0D
//   Cyan ring:   cx=184 cy=256 r=76 stroke=#00D9FF strokeWidth=40
//   Purple ring: cx=328 cy=256 r=76 stroke=#B06CFF strokeWidth=40
//   White dot:   cx=184 cy=256 r=14 fill=#FAFAFF

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

function makeSvg({ bg, bgOpaque, cyanColor, purpleColor, dotColor, viewBox }) {
  const vb = viewBox || '0 0 512 512';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="512" height="512">
  ${bgOpaque ? `<rect width="512" height="512" fill="${bgOpaque}"/>` : ''}
  <circle cx="184" cy="256" r="76" fill="none" stroke="${cyanColor}" stroke-width="40"/>
  <circle cx="328" cy="256" r="76" fill="none" stroke="${purpleColor}" stroke-width="40"/>
  <circle cx="184" cy="256" r="14" fill="${dotColor}"/>
</svg>`;
}

function render(svgStr, size, outPath) {
  const resvg = new Resvg(svgStr, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render();
  fs.writeFileSync(outPath, png.asPng());
  console.log(`wrote ${path.relative(process.cwd(), outPath)} (${size}×${size})`);
}

// 1. icon.png — 1024×1024, full icon with dark background
const svgFull = makeSvg({
  bgOpaque: '#0A0A0D',
  cyanColor: '#00D9FF',
  purpleColor: '#B06CFF',
  dotColor: '#FAFAFF',
});
render(svgFull, 1024, path.join(ASSETS, 'icon.png'));

// 2. android-icon-foreground.png — 1024×1024, transparent bg
//    viewBox zoomed in on the marks (+15% margin each side) so they fill the Android safe zone.
//    Marks bounding box in the 512 space: x=[108,404] y=[160,352] → w=296 h=192
//    Add ~20% padding: expand by 30px each side → viewBox 78 130 356 252
const svgFg = makeSvg({
  cyanColor: '#00D9FF',
  purpleColor: '#B06CFF',
  dotColor: '#FAFAFF',
  viewBox: '78 130 356 252',
});
render(svgFg, 1024, path.join(ASSETS, 'android-icon-foreground.png'));

// 3. android-icon-background.png — 1024×1024, solid #0A0A0D
const svgBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#0A0A0D"/>
</svg>`;
render(svgBg, 1024, path.join(ASSETS, 'android-icon-background.png'));

// 4. android-icon-monochrome.png — 1024×1024, white marks on transparent
const svgMono = makeSvg({
  cyanColor: '#FFFFFF',
  purpleColor: '#FFFFFF',
  dotColor: '#FFFFFF',
});
render(svgMono, 1024, path.join(ASSETS, 'android-icon-monochrome.png'));

// 5. favicon.png — 64×64, full icon with dark background
render(svgFull, 64, path.join(ASSETS, 'favicon.png'));

console.log('done');
