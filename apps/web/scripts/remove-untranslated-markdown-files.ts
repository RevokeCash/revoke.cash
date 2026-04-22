import { existsSync, readFileSync, rmSync } from 'fs';
import walkdir from 'walkdir';

const run = async () => {
  const paths = walkdir.sync('content');
  paths.forEach((path: string) => {
    if (path.includes('/en/')) return;
    if (!path.endsWith('.md')) return;

    const enPath = path.replace(/content\/.{2}\//, 'content/en/');

    if (existsSync(enPath)) {
      const enContent = readFileSync(enPath, 'utf-8');
      const originalContent = readFileSync(path, 'utf-8');
      if (enContent !== originalContent) return;
    }

    rmSync(path);
  });
};

run();
