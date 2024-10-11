const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use('/photos', express.static(path.join(__dirname, 'photos')));

const htmlFolder = path.join(__dirname, 'html');
if (!fs.existsSync(htmlFolder)) {
    fs.mkdirSync(htmlFolder);
}
//test
app.post('/', (req, res) => {
    const eventData = req.body;
    generateHtmlFile(eventData);
    res.send('JSON received and HTML generated');
});

function generateHtmlFile(data) {
    const events = data.EVENTS;
    const readerId = data.READER_ID;
    const readerName = data.READER_NAME;
    const timestamp = data.TIMESTAMP;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Details - ${readerId}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            .events-list {
                width: 100%;
            }
            .event {
                cursor: pointer;
                padding: 15px;
                border: 1px solid #ccc;
                margin-bottom: 10px;
                border-radius: 5px;
                transition: background-color 0.3s ease;
            }
            .event.selected {
                background-color: #e0e0e0;
            }
            .event p {
                margin: 5px 0;
            }
            .actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            button {
                padding: 10px 15px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            button:hover {
                background-color: #0056b3;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="events-list">
                <h1>Events</h1>
                <p><strong>Reader ID:</strong> ${readerId}</p>
                <p><strong>Reader Name:</strong> ${readerName}</p>
                <p><strong>Timestamp:</strong> ${timestamp}</p>
                ${events.map((event, index) => `
                    <div class="event ${index === 0 ? 'selected' : ''}" onclick="selectEvent(${index})">
                        <p><strong>ID:</strong> ${event.ID}</p>
                        <p><strong>Date:</strong> ${event.DATE}</p>
                        <p><strong>Ticket Name:</strong> ${event.TICKET_NAME}</p>
                        <p><strong>Ticket Type:</strong> ${event.TICKET_TYPE}</p>
                        <p><strong>Color:</strong> ${event.COLOR}</p>
                    </div>
                `).join('')}
                <div class="actions">
                    <button onclick="handleAction('info')">Info</button>
                    <button onclick="handleAction('block')">Block Card</button>
                    <button onclick="handleAction('unblock')">Unblock Card</button>
                </div>
            </div>
        </div>

        <script>
            let selectedEventIndex = 0;
            const events = ${JSON.stringify(events)};

            function selectEvent(index) {
                document.querySelectorAll('.event').forEach(el => el.classList.remove('selected'));
                document.querySelectorAll('.event')[index].classList.add('selected');
                selectedEventIndex = index;
            }

            function handleAction(action) {
                const cardId = events[selectedEventIndex].ID;
                fetch('/xsol-api-endpoint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: action, cardId: cardId })
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    if (data.success) {
                        alert('Action ' + action + ' performed successfully');
                    } else {
                        alert('Action ' + action + ' failed');
                    }
                });
            }
        </script>
    </body>
    </html>
    `;

    const filePath = path.join(htmlFolder, `${readerId}.html`);
    fs.writeFileSync(filePath, htmlContent);
    console.log(`HTML file generated/updated: ${filePath}`);
}

app.get('/:id', (req, res) => {
    const cardId = req.params.id;
    const filePath = path.join(htmlFolder, `${cardId}.html`);

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

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});