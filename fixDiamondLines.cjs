const fs = require('fs');
let content = fs.readFileSync('src/skinsDB.ts', 'utf-8');

let updated = content.replace(/lineColor: 'rgba\(255,255,255,0\.25\)'/g, "lineColor: 'rgba(255,255,255,0.8)'");
fs.writeFileSync('src/skinsDB.ts', updated);
console.log('Fixed diamond line color opacity.');
