const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config.js');

const API_BASE_URL = 'https://api.fireverseai.com';
const DEFAULT_HEADERS = {
    'accept': 'application/json',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
};

async function followModerator(token) {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/musicUserFans/followOrUnfollow?userId=${config.targetUserId}&status=1`,
            {
                headers: {
                    ...DEFAULT_HEADERS,
                    token
                }
            }
        );
        console.log(`✅ Successfully followed moderator with token: ${token.substring(0, 20)}...`);
        return true;
    } catch (error) {
        console.log(`ℹ️ Already following or error for token: ${token.substring(0, 20)}...`);
        console.log(`Error message: ${error.message}`);
        return false;
    }
}

async function main() {
    try {
        // Read all .txt files in the current directory
        const path = require('path');
        const txtFiles = fs.readdirSync(__dirname)
            .filter(file => file.endsWith('.txt'));

        if (txtFiles.length === 0) {
            console.log('❌ No .txt files found in directory');
            return;
        }

        console.log(`📁 Found ${txtFiles.length} .txt files`);
        
        // Read content from each .txt file
        let allTokens = [];
        for (const file of txtFiles) {
            const fileContent = fs.readFileSync(path.join(__dirname, file), 'utf8');
            
            // Extract tokens using regex
            const tokenRegex = /eyJhbGciOiJIUzI1NiJ9\.[^\n]+/g;
            const tokens = fileContent.match(tokenRegex) || [];
            
            console.log(`📄 Found ${tokens.length} tokens in ${file}`);
            allTokens = allTokens.concat(tokens);
        }

        if (allTokens.length === 0) {
            console.log('❌ No tokens found in any file');
            return;
        }

        console.log(`🔍 Found total ${allTokens.length} tokens`);
        console.log('🚀 Starting auto-follow process...\n');

        let successCount = 0;
        let failCount = 0;

        // Process each token
        for (let i = 0; i < allTokens.length; i++) {
            console.log(`\n📝 Processing token ${i + 1}/${allTokens.length}`);
            const success = await followModerator(allTokens[i]);
            
            if (success) successCount++;
            else failCount++;

            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n✨ Auto-follow process completed!');
        console.log(`✅ Successful follows: ${successCount}`);
        console.log(`❌ Failed follows: ${failCount}`);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    }
}

// Start the program
main().catch(console.error);