const express = require('express');
const fs = require('fs').promises;
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
fs.mkdir(jsonFolder, { recursive: true })
    .then(() => console.log(`Created JSON folder: ${jsonFolder}`))
    .catch(err => console.error(`Error creating JSON folder: ${err}`));

async function decodeImage(imagePath) {
    console.log(`Attempting to decode image: ${imagePath}`);
    try {
        console.log('Reading encoded image file...');
        const encodedImageBuffer = await fs.readFile(imagePath);
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

async function processEventData(eventData) {
    console.log('Processing event data...');
    if (eventData.EVENTS && eventData.EVENTS.length > 0) {
        for (let event of eventData.EVENTS) {
            if (event.ORG_PHOTO_PATH) {
                console.log(`Decoding original photo: ${event.ORG_PHOTO_PATH}`);
                event.PHOTO_ORG = await decodeImage(event.ORG_PHOTO_PATH);
                console.log(`Original photo decoded: ${event.PHOTO_ORG ? 'success' : 'failed'}`);
            }
            if (event.CUR_PHOTO_PATH) {
                console.log(`Decoding current photo: ${event.CUR_PHOTO_PATH}`);
                event.PHOTO_CUR = await decodeImage(event.CUR_PHOTO_PATH);
                console.log(`Current photo decoded: ${event.PHOTO_CUR ? 'success' : 'failed'}`);
            }
        }
    }
    return eventData;
}

app.post('/', cors(), async (req, res) => {
    const eventData = req.body;
    console.log('Received JSON data:', JSON.stringify(eventData, null, 2));

    const filePath = path.join(jsonFolder, `${eventData.READER_ID}.json`);
    console.log(`Saving data to file: ${filePath}`);

    try {
        await fs.writeFile(filePath, JSON.stringify(eventData, null, 2));
        console.log('Data saved successfully');

        // Process and decode images
        const processedData = await processEventData(eventData);

        console.log(`Emitting updateData event to room: ${eventData.READER_ID}`);
        console.log('Sending processed data to client:', JSON.stringify(processedData, null, 2));
        io.to(eventData.READER_ID).emit('updateData', JSON.stringify(processedData));

        res.send('JSON received, saved, and processed');
        console.log('Response sent to client');
    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).send('Error processing data');
    }
});

app.get('/:id', async (req, res) => {
    const filePath = path.join(jsonFolder, `${req.params.id}.json`);
    try {
        await fs.access(filePath);
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).send('JSON file not found');
        } else {
            res.status(500).send('Error reading JSON file');
        }
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('join', async (id) => {
        if (!id) {
            console.error('Received empty ID in join event');
            return;
        }
        socket.join(id);
        console.log(`User joined room: ${id}`);
        
        const filePath = path.join(jsonFolder, `${id}.json`);
        console.log(`Reading JSON file: ${filePath}`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            console.log('JSON file read successfully');
            let jsonData = JSON.parse(data);
            console.log(`Parsed JSON data. Events count: ${jsonData.EVENTS.length}`);
            
            // Process and decode images
            jsonData = await processEventData(jsonData);

            console.log('All events processed. Sending initial data to client...');
            socket.emit('initialData', JSON.stringify(jsonData));
        } catch (err) {
            console.error(`Error reading file ${id}.json:`, err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

http.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
