const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 3000;

// Import the C++ addon
const xsolcrypt = require('./xsolcrypt-addon/build/Release/xsolcrypt.node');

console.log('XSolCrypt addon loaded');

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));

app.options('/', cors());

const jsonFolder = path.join(__dirname, 'json');
if (!fs.existsSync(jsonFolder)) {
    fs.mkdirSync(jsonFolder);
    console.log(`Created JSON folder: ${jsonFolder}`);
}

function decodeImage(imagePath) {
    console.log(`Attempting to decode image: ${imagePath}`);
    try {
        console.log('Reading encoded image file...');
        const encodedImageBuffer = fs.readFileSync(imagePath);
        console.log(`Encoded image size: ${encodedImageBuffer.length} bytes`);
        
        console.log('Decoding image using C++ addon...');
        const decodedBuffer = xsolcrypt.decode(encodedImageBuffer);
        console.log(`Decoded image size: ${decodedBuffer.length} bytes`);
        
        console.log('Converting decoded image to base64...');
        const base64Image = decodedBuffer.toString('base64');
        console.log(`Base64 image length: ${base64Image.length} characters`);
        
        if (decodedBuffer[0] === 0xFF && decodedBuffer[1] === 0xD8 && decodedBuffer[2] === 0xFF) {
            console.log('Decoded data appears to be a valid JPEG image');
        } else if (decodedBuffer[0] === 0x89 && decodedBuffer[1] === 0x50 && decodedBuffer[2] === 0x4E && decodedBuffer[3] === 0x47) {
            console.log('Decoded data appears to be a valid PNG image');
        } else {
            console.log('Warning: Decoded data does not appear to be a valid image');
        }
        
        return base64Image;
    } catch (error) {
        console.error(`Error decoding image ${imagePath}:`, error);
        return null;
    }
}

app.post('/', cors(), (req, res) => {
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
        if (!id) {
            console.error('Received empty ID in join event');
            return;
        }
        socket.join(id);
        console.log(`User joined room: ${id}`);
        
        const filePath = path.join(jsonFolder, `${id}.json`);
        console.log(`Reading JSON file: ${filePath}`);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (!err) {
                console.log('JSON file read successfully');
                const jsonData = JSON.parse(data);
                console.log(`Parsed JSON data. Events count: ${jsonData.EVENTS.length}`);
                
                // Decode images for each event
                console.log('Starting to decode images for events...');
                jsonData.EVENTS = jsonData.EVENTS.map((event, index) => {
                    console.log(`Processing event ${index + 1}/${jsonData.EVENTS.length}`);
                    if (event.ORG_PHOTO_PATH) {
                        console.log(`Decoding original photo: ${event.ORG_PHOTO_PATH}`);
                        event.PHOTO_ORG = decodeImage(event.ORG_PHOTO_PATH);
                        console.log(`Original photo decoded: ${event.PHOTO_ORG ? 'success' : 'failed'}`);
                    }
                    if (event.CUR_PHOTO_PATH) {
                        console.log(`Decoding current photo: ${event.CUR_PHOTO_PATH}`);
                        event.PHOTO_CUR = decodeImage(event.CUR_PHOTO_PATH);
                        console.log(`Current photo decoded: ${event.PHOTO_CUR ? 'success' : 'failed'}`);
                    }
                    return event;
                });

                console.log('All events processed. Sending initial data to client...');
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
