const fs = require('fs');

const inputFile = 'generated_wallets.txt';
const outputFile = 'tokentuyul.txt'; // Nama file output diganti

// Fungsi untuk membaca file dan mengekstrak token
function extractTokens() {
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) {
            return console.error(`Gagal membaca file: ${err.message}`);
        }

        console.log('File dibaca dengan sukses.');

        // Ekstrak token menggunakan regex
        const tokenRegex = /Token:\s([a-zA-Z0-9._-]+)/g;
        const tokens = [...data.matchAll(tokenRegex)].map(match => match[1]);

        if (tokens.length === 0) {
            return console.log('Tidak ada token yang ditemukan.');
        }

        // Simpan token ke dalam file tokentuyul.txt
        fs.writeFile(outputFile, tokens.join('\n'), (err) => {
            if (err) {
                return console.error(`Gagal menyimpan file: ${err.message}`);
            }
            console.log(`Berhasil menyimpan ${tokens.length} token ke dalam ${outputFile}`);
        });
    });
}

// Jalankan fungsi ekstraksi token
extractTokens();
