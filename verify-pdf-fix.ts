import { PDFParse } from 'pdf-parse';

async function verify() {
    try {
        console.log('Testing PDFParse class...');
        const parser = new PDFParse({ data: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Length 5 >>\nstream\nhello\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF') });
        const result = await parser.getText();
        console.log('Success! Result:', result);
    } catch (e) {
        console.error('Failed:', e);
    }
}

verify();
