const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'whitelist.json');

function load() {
    try {
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return {};
    }
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    get(key) {
        return load()[key] ?? null;
    },
    set(key, value) {
        const data = load();
        data[key] = value;
        save(data);
    },
    delete(key) {
        const data = load();
        delete data[key];
        save(data);
    },
    all() {
        const data = load();
        return Object.entries(data).map(([ID, value]) => ({ ID, data: value }));
    }
};
