const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const logoPath = path.join(__dirname, '../public/assets/cynthia_logo.png');
  const publicDir = path.join(__dirname, '../public');

  if (!fs.existsSync(logoPath)) {
    console.error('Logo source not found at', logoPath);
    process.exit(1);
  }

  console.log('Generating PWA icons from', logoPath);

  // 1. Apple Touch Icon 180x180 with brand background #0c4a6e
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 12, g: 74, b: 110, alpha: 1 }, // #0c4a6e
    },
  })
    .composite([
      {
        input: await sharp(logoPath).resize(140, 140, { fit: 'contain' }).toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 2. Standard PWA 192x192 with brand background #0c4a6e and rounded aesthetic
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 12, g: 74, b: 110, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(logoPath).resize(150, 150, { fit: 'contain' }).toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 3. Standard PWA 512x512
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 12, g: 74, b: 110, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(logoPath).resize(400, 400, { fit: 'contain' }).toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 4. Maskable 512x512 (Logo inside 75% safe-zone to comply with Android squircle/circle masks)
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 12, g: 74, b: 110, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(logoPath).resize(340, 340, { fit: 'contain' }).toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Successfully generated all PWA icons!');
}

generateIcons().catch((err) => {
  console.error('Failed to generate icons', err);
  process.exit(1);
});
