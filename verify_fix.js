import { PDFParse } from 'pdf-parse';

// Create a minimal PDF-like buffer (not a real PDF, but pdf-parse might handle it or we can check if the constructor is valid)
// To be safe, let's just test if the class instantiation and getText method exist and don't throw immediately.

async function verify() {
    console.log('Verifying PDFParse API...');
    try {
        const dataBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/Contents 4 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Hello World) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000062 00000 n \n0000000117 00000 n \n0000000215 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n310\n%%EOF');

        const parser = new PDFParse({ data: dataBuffer });
        console.log('Constructor OK');

        const result = await parser.getText();
        console.log('getText() result received.');
        console.log('Extracted text:', JSON.stringify(result.text));

        if (result.text.includes('Hello World')) {
            console.log('✅ Verification SUCCESS: Text extracted correctly.');
        } else {
            console.log('⚠️ Verification PARTIAL: Extracted something, but not expected text.');
        }
    } catch (err) {
        console.error('❌ Verification FAILED:', err);
        process.exit(1);
    }
}

verify();
