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

app.post('/', (req, res) => {
    const eventData = req.body;
    generateHtmlFile(eventData);
    res.send('JSON received and HTML generated');
});

function generateHtmlFile(data) {
    const events = data.events;
    const id = data.id;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Event Details - ${id}</title>
        <style>
            body { display: flex; flex-direction: column; align-items: center; }
            .photos { display: flex; flex-direction: column; width: 100%; max-width: 600px; }
            .photo { width: 100%; height: 300px; object-fit: cover; margin-bottom: 10px; }
            .events-list { width: 100%; max-width: 600px; }
            .event { cursor: pointer; padding: 10px; border: 1px solid #ccc; margin-bottom: 5px; }
            .event.selected { background-color: #e0e0e0; }
        </style>
    </head>
    <body>
        <div class="photos">
            <img id="photo_cur" class="photo" src="${events[0].photo_cur}" alt="Current Photo">
            <img id="photo_org" class="photo" src="${events[0].photo_org}" alt="Original Photo">
        </div>
        <div class="events-list">
            <h1>Events - ID: ${id}</h1>
            ${events.map((event, index) => `
                <div class="event ${index === 0 ? 'selected' : ''}" onclick="selectEvent(${index})">
                    <p>Date: ${event.date}</p>
                    <p>Card ID: ${event.card_id}</p>
                    <p>Description: ${event.description}</p>
                    <p>Color: ${event.color}</p>
                </div>
            `).join('')}
            <button onclick="handleAction('info')">Info</button>
            <button onclick="handleAction('block')">Block Card</button>
            <button onclick="handleAction('unblock')">Unblock Card</button>
        </div>

        <script>
            let selectedEventIndex = 0;
            const events = ${JSON.stringify(events)};

            function selectEvent(index) {
                document.querySelectorAll('.event').forEach(el => el.classList.remove('selected'));
                document.querySelectorAll('.event')[index].classList.add('selected');
                selectedEventIndex = index;
                updatePhotos();
            }

            function updatePhotos() {
                const event = events[selectedEventIndex];
                document.getElementById('photo_cur').src = event.photo_cur;
                document.getElementById('photo_org').src = event.photo_org;
            }

            function handleAction(action) {
                const cardId = events[selectedEventIndex].card_id;
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

    const filePath = path.join(htmlFolder, `${id}.html`);
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