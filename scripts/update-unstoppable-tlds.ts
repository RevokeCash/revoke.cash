// Helper function to update unstoppableTlds.json
import fs from 'fs';
import path from 'path';

async function updateUnstoppableTlds() {
  const response = await fetch('https://api.unstoppabledomains.com/resolve/supported_tlds');
  const data = (await response.json()) as {
    tlds: string[];
    meta: Record<
      string,
      {
        namingService: string;
        registrationBlockchain: string;
      }
    >;
  };

  const tlds = Object.keys(data.meta);
  const udTlds = tlds.filter((tld) => data.meta[tld].namingService === 'UNS');

  // Format a ts file with the tlds
  const tsFile = `export const unstoppableTlds = ${JSON.stringify(udTlds)}`;

  // Write the file
  const filePath = path.join(process.cwd(), 'lib/utils/unstoppableTlds.ts');
  fs.writeFileSync(filePath, tsFile);
  console.log(`Wrote ${udTlds.length} tlds to ${filePath}`);
}

updateUnstoppableTlds();
