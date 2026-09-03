import sharp from 'sharp';
import { promises as fs } from 'node:fs';
const icon = 'public/icons/icon-512.svg';
const android = { mdpi:48, hdpi:72, xhdpi:96, xxhdpi:144, xxxhdpi:192 };
for (const [density,size] of Object.entries(android)) {
  for (const name of ['ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png']) {
    await sharp(icon).resize(size,size).png().toFile(`android/app/src/main/res/mipmap-${density}/${name}`);
  }
}
await sharp(icon).resize(1024,1024).png().toFile('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
const splash = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732"><rect width="2732" height="2732" fill="#0b2829"/><circle cx="1366" cy="1320" r="310" fill="none" stroke="#dfff8c" stroke-width="58"/><path d="M1070 1385c112-150 228-225 350-225 103 0 190 54 270 162" fill="none" stroke="#f3f2e9" stroke-width="58" stroke-linecap="round"/></svg>`);
for (const path of ['ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png','ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png','ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png']) await sharp(splash).png().toFile(path);
const androidSplashes = (await fs.readdir('android/app/src/main/res')).filter((name) => name.startsWith('drawable'));
for (const directory of androidSplashes) { const target = `android/app/src/main/res/${directory}/splash.png`; try { await sharp(splash).resize(1080,1920,{fit:'contain',background:'#0b2829'}).png().toFile(target); } catch {} }
