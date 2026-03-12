import pdfParse from 'pdf-parse';
import fs from 'fs';

console.log('pdfParse type:', typeof pdfParse);

// Try to parse a non-existent file to see if the function itself is valid
try {
    const dataBuffer = Buffer.from('test');
    pdfParse(dataBuffer).then(data => {
        console.log('Successfully called pdfParse');
    }).catch(err => {
        console.log('Caught error (expected):', err.message);
    });
} catch (err) {
    console.log('Immediate catch:', err.message);
}
