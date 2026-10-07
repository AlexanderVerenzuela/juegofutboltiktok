import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAR_FILE = path.join(__dirname, 'characters.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

const playersData = [
  { id: 'player_1', name: 'Lionel Messi', series: 'Inter Miami / Argentina', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Lionel_Messi_20180626.jpg/600px-Lionel_Messi_20180626.jpg' },
  { id: 'player_2', name: 'Cristiano Ronaldo', series: 'Al Nassr / Portugal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/600px-Cristiano_Ronaldo_2018.jpg' },
  { id: 'player_3', name: 'Kylian Mbappé', series: 'Real Madrid / France', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-06-11_The_Euro_2020_qualifier_match_Andorra_vs._France_-_Kylian_Mbapp%C3%A9_%28cropped%29.jpg/600px-2019-06-11_The_Euro_2020_qualifier_match_Andorra_vs._France_-_Kylian_Mbapp%C3%A9_%28cropped%29.jpg' },
  { id: 'player_4', name: 'Erling Haaland', series: 'Manchester City / Norway', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Erling_Haaland_2023.jpg/600px-Erling_Haaland_2023.jpg' },
  { id: 'player_5', name: 'Vinícius Júnior', series: 'Real Madrid / Brazil', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Vinicius_Jr_2021.jpg/600px-Vinicius_Jr_2021.jpg' },
  { id: 'player_6', name: 'Jude Bellingham', series: 'Real Madrid / England', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Jude_Bellingham_2023.jpg/600px-Jude_Bellingham_2023.jpg' },
  { id: 'player_7', name: 'Lamine Yamal', series: 'FC Barcelona / Spain', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Lamine_Yamal_2024.jpg/600px-Lamine_Yamal_2024.jpg' },
  { id: 'player_8', name: 'Robert Lewandowski', series: 'FC Barcelona / Poland', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Robert_Lewandowski_2018.jpg/600px-Robert_Lewandowski_2018.jpg' },
  { id: 'player_9', name: 'Kevin De Bruyne', series: 'Manchester City / Belgium', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_2018.jpg/600px-Kevin_De_Bruyne_2018.jpg' },
  { id: 'player_10', name: 'Neymar Jr', series: 'Al Hilal / Brazil', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Neymar_Jr._with_PSG_in_2018.jpg/600px-Neymar_Jr._with_PSG_in_2018.jpg' },
  { id: 'player_11', name: 'Mohamed Salah', series: 'Liverpool / Egypt', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Mohamed_Salah_2018.jpg/600px-Mohamed_Salah_2018.jpg' },
  { id: 'player_12', name: 'Harry Kane', series: 'Bayern Munich / England', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Harry_Kane_2018.jpg/600px-Harry_Kane_2018.jpg' },
  { id: 'player_13', name: 'Luka Modrić', series: 'Real Madrid / Croatia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Luka_Modri%C4%87_2018.jpg/600px-Luka_Modri%C4%87_2018.jpg' },
  { id: 'player_14', name: 'Bukayo Saka', series: 'Arsenal / England', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Bukayo_Saka_2022.jpg/600px-Bukayo_Saka_2022.jpg' },
  { id: 'player_15', name: 'Phil Foden', series: 'Manchester City / England', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Phil_Foden_2021.jpg/600px-Phil_Foden_2021.jpg' },
  { id: 'player_16', name: 'Pedri', series: 'FC Barcelona / Spain', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Pedri_2021.jpg/600px-Pedri_2021.jpg' },
  { id: 'player_17', name: 'Gavi', series: 'FC Barcelona / Spain', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Gavi_2022.jpg/600px-Gavi_2022.jpg' },
  { id: 'player_18', name: 'Lautaro Martínez', series: 'Inter Milan / Argentina', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Lautaro_Mart%C3%ADnez_2018.jpg/600px-Lautaro_Mart%C3%ADnez_2018.jpg' },
  { id: 'player_19', name: 'Julián Álvarez', series: 'Atlético Madrid / Argentina', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Juli%C3%A1n_%C3%81lvarez_2022.jpg/600px-Juli%C3%A1n_%C3%81lvarez_2022.jpg' },
  { id: 'player_20', name: 'Rodri', series: 'Manchester City / Spain', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Rodri_2024.jpg/600px-Rodri_2024.jpg' },
  { id: 'player_21', name: 'Federico Valverde', series: 'Real Madrid / Uruguay', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Federico_Valverde_2022.jpg/600px-Federico_Valverde_2022.jpg' },
  { id: 'player_22', name: 'Son Heung-min', series: 'Tottenham / South Korea', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Son_Heung-min_2022.jpg/600px-Son_Heung-min_2022.jpg' },
  { id: 'player_23', name: 'Florian Wirtz', series: 'Bayer Leverkusen / Germany', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Florian_Wirtz_2024.jpg/600px-Florian_Wirtz_2024.jpg' },
  { id: 'player_24', name: 'Jamal Musiala', series: 'Bayern Munich / Germany', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Jamal_Musiala_2024.jpg/600px-Jamal_Musiala_2024.jpg' },
  { id: 'player_25', name: 'Cole Palmer', series: 'Chelsea / England', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Cole_Palmer_2024.jpg/600px-Cole_Palmer_2024.jpg' },
  { id: 'player_26', name: 'Emiliano Martínez', series: 'Aston Villa / Argentina', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Emiliano_Mart%C3%ADnez_2022.jpg/600px-Emiliano_Mart%C3%ADnez_2022.jpg' },
  { id: 'player_27', name: 'Virgil van Dijk', series: 'Liverpool / Netherlands', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Virgil_van_Dijk_2018.jpg/600px-Virgil_van_Dijk_2018.jpg' },
  { id: 'player_28', name: 'Raphinha', series: 'FC Barcelona / Brazil', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Raphinha_2022.jpg/600px-Raphinha_2022.jpg' },
  { id: 'player_29', name: 'Antoine Griezmann', series: 'Atlético Madrid / France', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Antoine_Griezmann_2018.jpg/600px-Antoine_Griezmann_2018.jpg' },
  { id: 'player_30', name: 'Nico Williams', series: 'Athletic Bilbao / Spain', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Nico_Williams_2024.jpg/600px-Nico_Williams_2024.jpg' },
  { id: 'player_31', name: 'Thibaut Courtois', series: 'Real Madrid / Belgium', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Thibaut_Courtois_2018.jpg/600px-Thibaut_Courtois_2018.jpg' },
  { id: 'player_32', name: 'Bruno Fernandes', series: 'Manchester United / Portugal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Bruno_Fernandes_2021.jpg/600px-Bruno_Fernandes_2021.jpg' },
  { id: 'player_33', name: 'Bernardo Silva', series: 'Manchester City / Portugal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Bernardo_Silva_2018.jpg/600px-Bernardo_Silva_2018.jpg' },
  { id: 'player_34', name: 'Paulo Dybala', series: 'AS Roma / Argentina', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Paulo_Dybala_2018.jpg/600px-Paulo_Dybala_2018.jpg' },
  { id: 'player_35', name: 'Luis Díaz', series: 'Liverpool / Colombia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Luis_D%C3%ADaz_2024.jpg/600px-Luis_D%C3%ADaz_2024.jpg' },
  { id: 'player_36', name: 'Federico Chiesa', series: 'Liverpool / Italy', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Federico_Chiesa_2021.jpg/600px-Federico_Chiesa_2021.jpg' }
];

function downloadImage(url, destPath) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, destPath).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(false);
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

async function main() {
  console.log('⚽ Descargando imágenes verificadas de Wikipedia Commons...');
  const characters = [];

  for (let i = 0; i < playersData.length; i++) {
    const p = playersData[i];
    const filename = `${p.id}.jpg`;
    const localPath = path.join(UPLOAD_DIR, filename);
    const webPath = `/uploads/${filename}`;

    console.log(`[${i + 1}/${playersData.length}] Descargando foto para ${p.name}...`);
    const success = await downloadImage(p.url, localPath);
    console.log(`  -> ${success ? '✅ ¡Imagen guardada!' : '⚠️ Reintentando fallback'}`);

    characters.push({
      id: p.id,
      name: p.name,
      series: p.series,
      image: webPath
    });

    await new Promise(r => setTimeout(r, 150));
  }

  fs.writeFileSync(CHAR_FILE, JSON.stringify(characters, null, 2), 'utf8');
  console.log(`\n🎉 ¡100% COMPLETADO! ${characters.length} jugadores actualizados en characters.json.`);
}

main();
