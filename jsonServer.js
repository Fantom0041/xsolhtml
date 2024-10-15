const express = require('express');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const xsolApp = express();
const xsolPort = 4000;
const mainServerPort = 3000;
const mainServerUrl = `http://localhost:${mainServerPort}`;

xsolApp.use(express.json());

// Mock data generator function
function generateMockData() {
    const readerIds = ["69"];
    const readerNames = ["ORCZYK_LR1", "ORCZYK_LR2", "ORCZYK_LR3", "ORCZYK_LR4", "ORCZYK_LR5"];
    const ticketNames = ["NIEAKTUALNY!", "Taryfa serwisowa pkt", "Bilet normalny", "Bilet ulgowy"];
    const ticketTypes = ["-1", "12", "1", "2"];
    const colors = ["255", "22015", "65280", "16711680"];

    const randomIndex = Math.floor(Math.random() * readerIds.length);

    return {
        READER_ID: readerIds[randomIndex],
        READER_NAME: readerNames[randomIndex],
        TIMESTAMP: new Date().toISOString().replace('T', ' ').substr(0, 19),
        EVENTS: Array(8).fill().map(() => ({
            ID: Math.floor(Math.random() * 1000000000 + 1000000000).toString(),
            DATE: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString().replace('T', ' ').substr(0, 19),
            TICKET_NAME: ticketNames[Math.floor(Math.random() * ticketNames.length)],
            TICKET_TYPE: ticketTypes[Math.floor(Math.random() * ticketTypes.length)],
            ORG_PHOTO_PATH: 'test_pic/D438621323945S1702907564.jpgc',
            CUR_PHOTO_PATH: 'test_pic/D438621323945S1702907564.jpgc',
            COLOR: colors[Math.floor(Math.random() * colors.length)]
        }))
    };
}

const proxyConfig = {
    protocol: 'http',
    host: '172.16.2.254',
    port: 3128,
};

// Create a proxy agent
const httpsAgent = new HttpsProxyAgent(`${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`);
const axiosConfig = {
    httpsAgent,
    proxy: false  // This is important to prevent axios from using the system proxy
};

// Function to send mock data to the main server
function sendMockData() {
    const mockData = generateMockData();
    
    axios.post('http://localhost:3000/', mockData, axiosConfig)
        .then(response => {
            console.log('Mock data sent successfully:', response.data);
        })
        .catch(error => {
            console.error('Error sending mock data:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            } else if (error.request) {
                console.error('No response received');
            }
        });
};

function checkMainServer(retries = 5, delay = 2000) {
    console.log(`Attempting to connect to main server at ${mainServerUrl}/available-routes`);
    axios.get(`${mainServerUrl}/available-routes`, axiosConfig)
        .then(response => {
            console.log('Available routes on startup:', response.data);
        })
        .catch(error => {
            console.error(`Error connecting to main server: ${error.message}`);
            if (retries > 0) {
                console.log(`Retrying in ${delay/1000} seconds... (${retries} attempts left)`);
                setTimeout(() => checkMainServer(retries - 1, delay), delay);
            } else {
                console.error('Failed to connect to main server after multiple attempts');
            }
        });
}

// Send mock data when the server starts
sendMockData();


setInterval(sendMockData, 2000);

xsolApp.post('/xsol-api-endpoint', (req, res) => {
    console.log("Xsol server received:", req.body);
    res.json({ success: true, message: 'Action processed by Xsol server' });
});

xsolApp.listen(xsolPort, () => {
    console.log(`Mock Xsol server listening on port ${xsolPort}`);
    // checkMainServer();  // Start checking for the main server
});

// Uncomment these lines if you want to periodically send mock data
// setInterval(sendMockData, 10000);  // Send mock data every 10 seconds
