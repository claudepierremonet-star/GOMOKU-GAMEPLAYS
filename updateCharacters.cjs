const fs = require('fs');

let content = fs.readFileSync('src/types.ts', 'utf-8');

const getTierAndPrice = (idx, total) => {
    let pct = idx / total;
    if (pct < 0.3) return { tier: 'Classic', price: 100 };
    if (pct < 0.6) return { tier: 'Silver', price: 500 };
    if (pct < 0.8) return { tier: 'Gold', price: 1500 };
    if (pct < 0.95) return { tier: 'Diamond', price: 3000 };
    return { tier: 'Platinum', price: 5000 };
};

let matchCount = 0;
// We look for objects inside the CHARACTERS array.
// They look like: { id: '...', name: '...', avatar: '...', bio: '...', defaultSkin: '...', color: '...' },
content = content.replace(/{ id: '([^']+)', name: '([^']+)', avatar: '([^']+)', bio: '((?:[^'\\]|\\.)*)', defaultSkin: '([^']+)', color: '([^']+)' }/g, (match, id, name, avatar, bio, defSkin, color) => {
    let tp = getTierAndPrice(matchCount, 102);
    matchCount++;
    return `{ id: '${id}', name: '${name}', avatar: '${avatar}', bio: '${bio}', defaultSkin: '${defSkin}', color: '${color}', tier: '${tp.tier}', price: ${tp.price} }`;
});

fs.writeFileSync('src/types.ts', content);
console.log('Replaced', matchCount, 'characters');
