const fs = require('fs');
const detectCharacterEncoding = require('detect-character-encoding'); //npm install detect-character-encoding
const f='/home/artisan/perrisbrewery/perrisbrewery/template/man.template.md'
const buffer = fs.readFileSync(f);
const originalEncoding = detectCharacterEncoding(buffer);
console.log('originalEncoding: ' + originalEncoding.encoding)
const file = fs.readFileSync(f, originalEncoding.encoding);
fs.writeFileSync(f, file, 'UTF-8');
