const express = require('express');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const xsolApp = express();
const xsolPort = 4000;
const mainServerPort = 3000;

// Determine the main server URL based on the environment
const mainServerUrl = process.env.NODE_ENV === 'production'
    ? 'https://xsolhtml.onrender.com'
    : `http://localhost:${mainServerPort}`;

console.log(`Main server URL: ${mainServerUrl}`);

xsolApp.use(express.json());

// Mock data generator function
function generateMockData() {
    const readerIds = ["500", "69"];
    const readerNames = ["ORCZYK_LR1", "ORCZYK_LR2", "ORCZYK_LR3", "ORCZYK_LR4", "ORCZYK_LR5"];
    const ticketNames = ["NIEAKTUALNY!", "Taryfa serwisowa pkt", "Bilet normalny", "Bilet ulgowy"];
    const ticketTypes = ["-1", "12", "1", "2"];
    const colors = ["255", "22015", "65280", "16711680"];
    const photoFiles = [
        "D1793379326S1728655200.jpgc",
        "D1793379326S1728655298.jpgc",
        "D438621323945S1702907564.jpgc"
    ];

    const randomIndex = Math.floor(Math.random() * readerIds.length);

    return {
        READER_ID: readerIds[randomIndex],
        READER_NAME: readerNames[Math.floor(Math.random() * readerNames.length)],
        TIMESTAMP: new Date().toISOString().replace('T', ' ').substr(0, 19),
        EVENTS: Array(8).fill().map(() => {
            const randomPhoto = photoFiles[Math.floor(Math.random() * photoFiles.length)];
            return {
                EVENT_ID: Math.floor(Math.random() * 1000000000 + 1000000000).toString(),
                ID: Math.floor(Math.random() * 1000000000 + 1000000000).toString(),
                DATE: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString().replace('T', ' ').substr(0, 19),
                TICKET_NAME: ticketNames[Math.floor(Math.random() * ticketNames.length)],
                TICKET_TYPE: ticketTypes[Math.floor(Math.random() * ticketTypes.length)],
                ORG_PHOTO_PATH: `test_pic/${randomPhoto}`,
                CUR_PHOTO_PATH: `test_pic/${randomPhoto}`,
                COLOR: colors[Math.floor(Math.random() * colors.length)]
            };
        })
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
    proxy: false
};

// Function to send mock data to the main server
function sendMockData() {
    const mockData = generateMockData();
    
    const config = process.env.NODE_ENV_PROXY === 'true' ? axiosConfig : {};

    axios.post(`${mainServerUrl}/`, mockData, config)
        .then(response => {
            console.log(`Mock data sent successfully to ${mainServerUrl}:`, response.data);
        })
        .catch(error => {
            console.error(`Error sending mock data to ${mainServerUrl}:`, error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            } else if (error.request) {
                console.error('No response received');
            }
        });
}

function checkMainServer(retries = 5, delay = 2000) {
    console.log(`Attempting to connect to main server at ${mainServerUrl}/available-routes`);
    const config = process.env.NODE_ENV_PROXY === 'true' ? axiosConfig : {};
    
    axios.get(`${mainServerUrl}/available-routes`, config)
        .then(response => {
            console.log('Available routes on startup:');
            response.data.forEach(route => {
                console.log(`- ${route.id}: ${route.name} (${route.url})`);
            });
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

// Set interval for sending mock data
setInterval(sendMockData, 2000);

xsolApp.post('/xsol-api-endpoint', (req, res) => {
    console.log("Xsol server received:", req.body);
    res.json({ success: true, message: 'Action processed by Xsol server' });
});

xsolApp.listen(xsolPort, () => {
    console.log(`Mock Xsol server listening on port ${xsolPort}`);
    checkMainServer();  // Start checking for the main server
});

// Uncomment these lines if you want to periodically send mock data
// setInterval(sendMockData, 10000);  // Send mock data every 10 seconds
