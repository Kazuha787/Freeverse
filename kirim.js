const ethers = require('ethers');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

const API_BASE_URL = 'https://api.fireverseai.com';
const WEB3_URL = 'https://web3.fireverseai.com';
const APP_URL = 'https://app.fireverseai.com';

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Content-Type': 'application/json',
    'sec-ch-ua-platform': '"Windows"',
    'x-version': '1.0.100',
    'origin': APP_URL,
    'referer': `${APP_URL}/`,
    'sec-fetch-site': 'same-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty'
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function getSession() {
    try {
        const response = await axios.get(`${API_BASE_URL}/walletConnect/getSession`, {
            headers: DEFAULT_HEADERS
        });
        return response.data.data;
    } catch (error) {
        console.error('❌ Error getting session:', error.message);
        return null;
    }
}

async function getNonce() {
    try {
        const response = await axios.get(`${API_BASE_URL}/walletConnect/nonce`);
        return response.data.data.nonce;
    } catch (error) {
        console.error('❌ Error getting nonce:', error.message);
        return null;
    }
}

async function signMessage(wallet, nonce) {
    const messageToSign = `web3.fireverseai.com wants you to sign in with your Ethereum account:\n${wallet.address}\n\nPlease sign with your account\n\nURI: https://web3.fireverseai.com\nVersion: 1\nChain ID: 8453\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;
    
    const signingKey = new ethers.SigningKey(wallet.privateKey);
    const messageHash = ethers.hashMessage(messageToSign);
    const signature = signingKey.sign(messageHash);
    
    return {
        message: messageToSign,
        signature: signature.serialized
    };
}

async function verifyWallet(message, signature) {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/walletConnect/verify`,
            {
                message,
                signature,
                wallet: "bee"
            },
            { headers: DEFAULT_HEADERS }
        );
        return response.data;
    } catch (error) {
        console.error('❌ Error verifying wallet:', error.message);
        return null;
    }
}

async function getUserInfo(token) {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/userInfo/getMyInfo`,
            { 
                headers: { 
                    ...DEFAULT_HEADERS,
                    token 
                } 
            }
        );
        return response.data.data;
    } catch (error) {
        console.error('❌ Error getting user info:', error.message);
        return null;
    }
}

async function sendPoints(token, score) {
    try {
        // Prompt for target user ID
        const targetUserId = await question('Enter target user ID to send points to: ');
        
        // Calculate 90% of score (10% fee reduction)
        const sendScores = Math.floor(score * 0.9);
        
        console.log(`💰 Original Score: ${score}`);
        console.log(`📤 Sending Score (after 10% fee): ${sendScores}`);
        console.log(`👤 Sending to user ID: ${targetUserId}`);

        const response = await axios.post(
            `${API_BASE_URL}/musicUserScore/sendPoints`,
            {
                sendScore: sendScores,
                sendUserId: targetUserId
            },
            {
                headers: {
                    ...DEFAULT_HEADERS,
                    token
                }
            }
        );
        
        console.log('✅ Points sent successfully');
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Failed to send points:', error.message);
        if (error.response) {
            console.error('📝 Error response:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function processWallet(privateKey) {
    try {
        // Create wallet from private key
        const wallet = new ethers.Wallet(privateKey);
        console.log('🔑 Using wallet address:', wallet.address);

        // Get session and nonce
        const session = await getSession();
        if (!session) return false;

        const nonce = await getNonce();
        if (!nonce) return false;

        // Sign message and verify wallet
        const { message, signature } = await signMessage(wallet, nonce);
        const verifyResult = await verifyWallet(message, signature);
        
        if (!verifyResult?.success) {
            console.log('❌ Wallet verification failed');
            return false;
        }

        const token = verifyResult.data.token;
        console.log('🔓 Login successful, got token');

        // Get user info to check score
        const userInfo = await getUserInfo(token);
        if (!userInfo) return false;

        // Send points
        await sendPoints(token, userInfo.score);
        
        return true;
    } catch (error) {
        console.error('❌ Error processing wallet:', error.message);
        return false;
    }
}

async function main() {
    try {
        // Read private keys from generated_wallets.txt
        const content = fs.readFileSync('generated_wallets.txt', 'utf8');
        const privateKeys = content.match(/Private Key: (0x[a-fA-F0-9]{64})/g)
            ?.map(match => match.split(': ')[1]) || [];

        if (privateKeys.length === 0) {
            console.log('❌ No private keys found in generated_wallets.txt');
            return;
        }

        console.log(`📝 Found ${privateKeys.length} wallets`);

        for (let i = 0; i < privateKeys.length; i++) {
            console.log(`\n🔄 Processing wallet ${i + 1}/${privateKeys.length}`);
            await processWallet(privateKeys[i]);

            if (i < privateKeys.length - 1) {
                console.log('\n⏳ Waiting 3 seconds before next wallet...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        console.log('\n✨ All wallets processed');
    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        rl.close(); // Close readline interface
    }
}

// Start the program
main().catch(console.error);