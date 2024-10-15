const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Add this line
const app = express();
const http = require('http').createServer(app);
// const io = require('socket.io')(http);
const port = 3005;
// const XSolCrypt = require('./decoder'); // Import the XSolCrypt class

// Enable CORS
app.use(cors());


const XSolCrypt = require('./decoder'); // Import the XSolCrypt class

// Create an instance of XSolCrypt
const xsolCrypt = new XSolCrypt();

// decoded immage is photos/D438621323945S1702907564.jpgc

// Serve static files from the 'photos' directory
app.use('/photos', express.static('photos'));

// Function to encode an image
function encodeImage(imagePath) {
    console.log(`Attempting to encode image: ${imagePath}`);
    try {
        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Convert buffer to string
        const imageString = imageBuffer.toString('binary');
        
        // Encode the image
        const encodedImage = xsolCrypt.encode(imageString);
        
        // Generate the new filename
        const dir = path.dirname(imagePath);
        const ext = path.extname(imagePath);
        const baseName = path.basename(imagePath, ext);
        const encodedImagePath = path.join(dir, `${baseName}_encoded${ext}c`);
        
        // Write the encoded image
        fs.writeFileSync(encodedImagePath, encodedImage, 'binary');
        
        console.log(`Encoded image saved to: ${encodedImagePath}`);
        return encodedImagePath;
    } catch (error) {
        console.error(`Error encoding image ${imagePath}:`, error);
        return null;
    }
}

// Endpoint to encode an image
app.get('/encode/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, 'photos', imageName);
    
    const encodedImagePath = encodeImage(imagePath);
    
    if (encodedImagePath) {
        res.json({ success: true, encodedImage: path.basename(encodedImagePath) });
    } else {
        res.status(500).json({ success: false, error: 'Failed to encode image' });
    }
});

// decoded immage is photos/D438621323945S1702907564.jpgc

// Serve static files from the 'photos' directory
app.use('/photos', express.static('photos'));

// Endpoint to decode an image
app.get('/decode/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, 'photos', imageName);
    
    const decodedImagePath = decodeImage(imagePath);
    
    if (decodedImagePath) {
        res.json({ success: true, decodedImage: path.basename(decodedImagePath) });
    } else {
        res.status(500).json({ success: false, error: 'Failed to decode image' });
    }
});
function decodeImage(imagePath) {
    console.log(`Attempting to decode image: ${imagePath}`);
    try {
        console.log('Reading encoded image file...');
        const encodedImage = fs.readFileSync(imagePath, 'binary');
        console.log(`Encoded image length: ${encodedImage.length} bytes`);
        
        console.log('Decoding image...');
        const decodedImage = xsolCrypt.decode(encodedImage);
        console.log(`Decoded image length: ${decodedImage.length} bytes`);
        
        // Check if the decoded data looks like a JPEG
        const isJpeg = decodedImage.slice(0, 3).toString('hex').toUpperCase() === 'FFD8FF';
        console.log(`Decoded data appears to be a valid JPEG: ${isJpeg}`);
        
        // Save raw decoded data
        const rawDecodedPath = path.join(path.dirname(imagePath), `raw_decoded_${path.basename(imagePath, '.jpgc')}.bin`);
        fs.writeFileSync(rawDecodedPath, decodedImage);
        console.log(`Raw decoded data written to: ${rawDecodedPath}`);
        
        // If it looks like a JPEG, save it as a .jpg file
        if (isJpeg) {
            const decodedImagePath = path.join(path.dirname(imagePath), `decoded_${path.basename(imagePath, '.jpgc')}.jpg`);
            fs.writeFileSync(decodedImagePath, decodedImage);
            console.log(`Decoded image written to: ${decodedImagePath}`);
            return decodedImagePath;
        } else {
            console.log('Decoded data does not appear to be a valid JPEG. Check the raw decoded file.');
            return null;
        }
    } catch (error) {
        console.error(`Error decoding image ${imagePath}:`, error);
        return null;
    }
}



// Start the server
http.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    
    // Encode cur1.png on server start
    const imagePath = path.join(__dirname, 'photos', 'cur1.png');
    encodeImage(imagePath);
});
