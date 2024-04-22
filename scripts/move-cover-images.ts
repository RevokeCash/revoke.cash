import { copyFileSync, mkdirSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';

const imageFiles = globSync(path.join(__dirname, '..', '.next', 'server', 'app', '*', '**', '*.body'));

imageFiles.forEach((fn) => {
  const newFn = fn
    .replace(
      path.join(__dirname, '..', '.next', 'server', 'app'),
      path.join(__dirname, '..', 'public', 'assets', 'images', 'generated'),
    )
    .replace('.body', '');
  mkdirSync(path.dirname(newFn), { recursive: true });
  copyFileSync(fn, newFn);
  console.log(newFn);
});

console.log(`Generated ${imageFiles.length} images`);
