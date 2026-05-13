const fs = require('fs');

let content = fs.readFileSync('src/types.ts', 'utf-8');

let counter = 1000;
content = content.replace(/{ id: '([^']+)', name: '([^']+)', avatar: '([^']+)', bio: '((?:[^'\\]|\\.)*)', defaultSkin: '([^']+)', color: '([^']+)', tier: '([^']+)', price: (\d+) }/g, (match, id, name, avatar, bio, defSkin, color, tier, price) => {
    if (tier && tier !== 'Classic') {
        const prefix = tier.substring(0, 3).toUpperCase();
        const serial = `AVR-${prefix}-${counter++}`;
        return `{ id: '${id}', name: '${name}', avatar: '${avatar}', bio: '${bio}', defaultSkin: '${defSkin}', color: '${color}', tier: '${tier}', price: ${price}, serialNumber: '${serial}' }`;
    }
    return match;
});

fs.writeFileSync('src/types.ts', content);
console.log("Updated avatars in types.ts");
