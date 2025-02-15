const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

const API_BASE_URL = 'https://api.fireverseai.com';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function readToken() {
    try {
        return fs.readFileSync('token.txt', 'utf8').trim();
    } catch (error) {
        console.error('Error reading token.txt:', error.message);
        process.exit(1);
    }
}

function createAxiosInstance(token) {
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'accept': '*/*',
            'token': token,
            'x-version': '1.0.100',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
        }
    });
}

async function getMyBalance(api) {
    try {
        const response = await api.get('/userInfo/getMyInfo');
        return response.data.data.score;
    } catch (error) {
        console.error('Error getting balance:', error.message);
        throw error;
    }
}

async function checkUserExists(api, userId) {
    try {
        const response = await api.get(`/userInfo/getByUserId?userId=${userId}`);
        return response.data.success;
    } catch (error) {
        return false;
    }
}

function calculateFee(amount) {
    return Math.floor(amount / 10);
}

async function sendPoints(api, userId, amount) {
    try {
        const response = await api.post('/musicUserScore/sendPoints', {
            sendScore: amount,
            sendUserId: parseInt(userId)
        });
        return response.data.success;
    } catch (error) {
        console.error('Error sending points:', error.message);
        throw error;
    }
}


async function main() {
    console.log('Points Sender Bot Starting...');
    
    
    const token = readToken();
    const api = createAxiosInstance(token);
    
    try {
        
        const balance = await getMyBalance(api);
        console.log(`Current balance: ${balance} points`);
        
        
        rl.question('Enter target user ID: ', async (userId) => {
            
            const userExists = await checkUserExists(api, userId);
            if (!userExists) {
                console.error('User ID not found!');
                rl.close();
                return;
            }
            
            rl.question('Enter amount to send: ', async (amount) => {
                amount = parseInt(amount);
                const fee = calculateFee(amount);
                const totalDeduction = amount + fee;
                
                if (isNaN(amount) || amount <= 0) {
                    console.error('Invalid amount!');
                    rl.close();
                    return;
                }
                
                if (totalDeduction > balance) {
                    console.error('Insufficient balance! (including fee)');
                    console.log(`Required: ${totalDeduction} (${amount} + ${fee} fee)`);
                    console.log(`Available: ${balance}`);
                    rl.close();
                    return;
                }
                
                console.log(`\nTransaction Summary:`);
                console.log(`- Amount to send: ${amount}`);
                console.log(`- Fee (10%): ${fee}`);
                console.log(`- Total deduction: ${totalDeduction}`);
                
                rl.question('\nConfirm transaction? (y/n): ', async (answer) => {
                    if (answer.toLowerCase() === 'y') {
                        try {
                            const success = await sendPoints(api, userId, amount);
                            if (success) {
                                console.log('\nTransaction successful!');
                                const newBalance = await getMyBalance(api);
                                console.log(`New balance: ${newBalance} points`);
                            } else {
                                console.log('\nTransaction failed!');
                            }
                        } catch (error) {
                            console.error('\nTransaction failed:', error.message);
                        }
                    } else {
                        console.log('\nTransaction cancelled.');
                    }
                    rl.close();
                });
            });
        });
    } catch (error) {
        console.error('An error occurred:', error.message);
        rl.close();
    }
}

// Start the bot
main();
