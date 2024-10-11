const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

// Enable JSON body parsing
app.use(express.json());

// Default route (API POST endpoint) - receives JSON data and generates HTML
app.post('/', (req, res) => {
    const eventData = req.body;
    generateHtmlFile(eventData);
    res.send('JSON received and HTML generated');
});

function generateHtmlFile(data) {
    const events = data.Events;
    const id = data.id;

    // Generate HTML content (using template literals for simplicity)
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Event Details - ${id}</title>
            <style>
                .event-details { display: none; }
                .event-details.active { display: block; }
            </style>
        </head>
        <body>
            <h1>Event Details - Card ID: ${events.Card_id}</h1>
            <div id="latestEvent" class="event-details active">
                <p>Date: ${events.Date}</p>
                <p>Description: ${events.Description}</p>
                <p>Color: ${events.Color}</p>
                <img src="${events.Photo_cur}" alt="Current Photo">
            </div>

            <button onclick="handleAction('info', '${events.Card_id}')">Info</button>
            <button onclick="handleAction('block', '${events.Card_id}')">Block Card</button>
            <button onclick="handleAction('unblock', '${events.Card_id}')">Unblock Card</button>

            <script>
                function handleAction(action, cardId) {
                    fetch('/xsol-api-endpoint', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: action, cardId: cardId })
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                        // Update the page based on the response
                        if (data.success) {
                            alert(Action ${action} performed successfully);
                        } else {
                            alert(Action ${action} failed);
                        }
                    });
                }
            </script>
        </body>
        </html>
    `;

    // Write the HTML content to a file (e.g., 1.html, 2.html based on ID)
    fs.writeFileSync(`${id}.html`, htmlContent);
}

// API GET endpoint - sends the generated HTML file
app.get('/:id', (req, res) => {
    const cardId = req.params.id;
    const filePath = `${cardId}.html`;

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('HTML file not found');
            } else {
                return res.status(500).send('Error reading HTML file');
            }
        }
        res.send(data);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

