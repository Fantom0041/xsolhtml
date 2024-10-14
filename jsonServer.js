const express = require('express');
const axios = require('axios');

const xsolApp = express();
const xsolPort = 4000;

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
            ORG_PHOTO_PATH: 'photos/D438621323945S1702907564.jpgc',
            CUR_PHOTO_PATH: 'photos/D438621323945S1702907564.jpgc',
            COLOR: colors[Math.floor(Math.random() * colors.length)]
        }))
    };
}

// Function to send mock data to the main server
function sendMockData() {
    const mockData = generateMockData();
    axios.post('https://xsolhtml.onrender.com:3000', mockData)
    // axios.post('http://localhost:3000', mockData)
        .then(response => {
            console.log('Mock data sent successfully:', response.data);
        })
        .catch(error => {
            console.error('Error sending mock data:', error.message);
        });
}

// Send mock data when the server starts
sendMockData();

// Optionally, send new mock data every 30 seconds
setInterval(sendMockData, 2000);

xsolApp.post('/xsol-api-endpoint', (req, res) => {
    console.log("Xsol server received:", req.body);
    res.json({ success: true, message: 'Action processed by Xsol server' });
});

xsolApp.listen(xsolPort, () => {
    console.log(`Mock Xsol server listening on port ${xsolPort}`);
});
