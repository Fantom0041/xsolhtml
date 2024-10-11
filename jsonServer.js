const express = require('express');
const axios = require('axios');

const xsolApp = express();
const xsolPort = 4000;

xsolApp.use(express.json());

// Mock data generator function
function generateMockData() {
    return {
        id: Math.floor(Math.random() * 100) + 1,
        events: [
            {
                date: new Date().toISOString(),
                card_id: `card-${Math.floor(Math.random() * 1000)}`,
                description: "First mock event description",
                color: ["red", "green", "blue", "yellow"][Math.floor(Math.random() * 4)],
                photo_org: "http://example.com/original1.jpg",
                photo_cur: "http://example.com/current1.jpg"
            },
            {
                date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                card_id: `card-${Math.floor(Math.random() * 1000)}`,
                description: "Second mock event description",
                color: ["red", "green", "blue", "yellow"][Math.floor(Math.random() * 4)],
                photo_org: "http://example.com/original2.jpg",
                photo_cur: "http://example.com/current2.jpg"
            },
            {
                date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                card_id: `card-${Math.floor(Math.random() * 1000)}`,
                description: "Third mock event description",
                color: ["red", "green", "blue", "yellow"][Math.floor(Math.random() * 4)],
                photo_org: "http://example.com/original3.jpg",
                photo_cur: "http://example.com/current3.jpg"
            }
        ],
        timestamp: new Date().toISOString()
    };
}

// Function to send mock data to the main server
function sendMockData() {
    const mockData = generateMockData();
    axios.post('http://localhost:3000', mockData)
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
setInterval(sendMockData, 30000);

xsolApp.post('/xsol-api-endpoint', (req, res) => {
    console.log("Xsol server received:", req.body);
    res.json({ success: true, message: 'Action processed by Xsol server' });
});

xsolApp.listen(xsolPort, () => {
    console.log(`Mock Xsol server listening on port ${xsolPort}`);
});

