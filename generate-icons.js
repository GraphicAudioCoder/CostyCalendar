const fs = require('fs');
const { createCanvas } = require('canvas');

// Funzione per creare un'icona semplice viola
function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Sfondo viola
  ctx.fillStyle = '#8000ff';
  ctx.fillRect(0, 0, size, size);
  
  // Bordo arrotondato
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.15);
  ctx.fill();
  
  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
  
  // Lettera "C" bianca al centro
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', size / 2, size / 2);
  
  return canvas.toBuffer('image/png');
}

// Genera le icone
try {
  const icon192 = createIcon(192);
  const icon512 = createIcon(512);
  
  fs.writeFileSync('./public/icon192.png', icon192);
  fs.writeFileSync('./public/icon512.png', icon512);
  
  console.log('Icone generate con successo!');
} catch (error) {
  console.error('Errore nella generazione delle icone:', error.message);
  console.log('Installare canvas con: npm install canvas');
}
