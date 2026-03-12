import { createRequire } from 'module';
const _require = createRequire(import.meta.url);

async function test() {
  const pdfModule = _require('pdf-parse');
  console.log('Type of pdfModule:', typeof pdfModule);
  console.log('pdfModule keys:', Object.keys(pdfModule));
  console.log('pdfModule.default type:', typeof pdfModule.default);
  
  // Some versions of pdf-parse might be exported differently
  // Let's see if we can find a function anywhere
  for (const key in pdfModule) {
    console.log(`Key "${key}" type:`, typeof pdfModule[key]);
  }
}

test();
