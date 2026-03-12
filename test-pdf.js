const { createRequire } = require('module');
const _require = createRequire(__filename);
const pdf = _require('pdf-parse');

console.log('Type of pdf:', typeof pdf);
console.log('pdf properties:', Object.keys(pdf));

if (typeof pdf === 'function') {
  console.log('✅ Success: pdf is a function');
} else if (pdf && typeof pdf.default === 'function') {
  console.log('💡 Note: pdf.default is a function');
} else {
  console.log('❌ Error: Could not find pdf function');
}
