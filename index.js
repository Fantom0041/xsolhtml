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
    console.log('Received JSON data:', JSON.stringify(eventData, null, 2));

    const filePath = path.join(jsonFolder, `${eventData.READER_ID}.json`);
    console.log(`Saving data to file: ${filePath}`);

    fs.writeFileSync(filePath, JSON.stringify(eventData, null, 2));
    console.log('Data saved successfully');

    console.log(`Emitting updateData event to room: ${eventData.READER_ID}`);
    io.to(eventData.READER_ID).emit('updateData', eventData);

    res.send('JSON received and saved');
    console.log('Response sent to client');
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
    
    socket.on('join', (id) => {
        socket.join(id);
        console.log(`User joined room: ${id}`);
        
        const filePath = path.join(jsonFolder, `${id}.json`);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (!err) {
                const jsonData = JSON.parse(data);
                console.log('Sending initial data:', jsonData);
                socket.emit('initialData', jsonData);
            } else {
                console.error(`Error reading file ${id}.json:`, err);
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

http.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
