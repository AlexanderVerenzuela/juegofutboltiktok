import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const testUrl = 'https://cdn.futwiz.com/assets/img/fc26/social/smallcards/33_name.png';
const dest = path.join(process.cwd(), 'public', 'uploads', 'mbappe_futwiz_transparent.png');

https.get(testUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  console.log('Status:', res.statusCode);
  if (res.statusCode === 200) {
    const stream = fs.createWriteStream(dest);
    res.pipe(stream);
    stream.on('finish', () => {
      console.log('Successfully saved transparent Futwiz Mbappé card to:', dest);
    });
  }
}).on('error', console.error);
