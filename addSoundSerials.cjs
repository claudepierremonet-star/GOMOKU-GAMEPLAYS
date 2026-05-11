const fs = require('fs');

let content = fs.readFileSync('src/soundsDB.ts', 'utf-8');

// Also update the interface
content = content.replace("tier: 'Classic' | 'Silver' | 'Gold' | 'Diamond' | 'Platinum';", "tier: 'Classic' | 'Silver' | 'Gold' | 'Diamond' | 'Platinum';\n  serialNumber?: string;");

let counter = 1000;
content = content.replace(/{ id: '([^']+)', name: '([^']+)', price: (\d+), description: '([^']+)', tier: '([^']+)' }/g, (match, id, name, price, desc, tier) => {
    if (tier !== 'Classic') {
        const prefix = tier.substring(0, 3).toUpperCase();
        const serial = `SND-${prefix}-${counter++}`;
        return `{ id: '${id}', name: '${name}', price: ${price}, description: '${desc}', tier: '${tier}', serialNumber: '${serial}' }`;
    }
    return match;
});

fs.writeFileSync('src/soundsDB.ts', content);
console.log("Updated soundsDB.ts");
