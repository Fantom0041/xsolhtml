const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const jsonFolder = path.join(__dirname, 'json');
if (!fs.existsSync(jsonFolder)) {
    fs.mkdirSync(jsonFolder);
}

app.post('/', (req, res) => {
    const eventData = req.body;
    const filePath = path.join(jsonFolder, `${eventData.READER_ID}.json`);
    fs.writeFileSync(filePath, JSON.stringify(eventData, null, 2));
    io.emit('updateData', eventData);
    res.send('JSON received and saved');
});

app.get('/:id', (req, res) => {
    const filePath = path.join(jsonFolder, `${req.params.id}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('JSON file not found');
            } else {
                return res.status(500).send('Error reading JSON file');
            }
        }
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
});

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('requestData', (id) => {
        const filePath = path.join(jsonFolder, `${id}.json`);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (!err) {
                socket.emit('initialData', JSON.parse(data));
            }
        });
    });
});

http.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
