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

// Function to decode an image
function decodeImage(encodedImagePath) {
    console.log(`Attempting to decode image: ${encodedImagePath}`);
    try {
        // Read the encoded image file
        const encodedImageBuffer = fs.readFileSync(encodedImagePath);
        
        // Decode the image
        const decodedImage = xsolCrypt.decode(encodedImageBuffer);
        
        // Generate the new filename
        const dir = path.dirname(encodedImagePath);
        const ext = path.extname(encodedImagePath).slice(0, -1); // Remove the 'c' at the end
        const baseName = path.basename(encodedImagePath, path.extname(encodedImagePath));
        const decodedImagePath = path.join(dir, `${baseName}_decoded${ext}`);
        
        // Write the decoded image
        fs.writeFileSync(decodedImagePath, decodedImage);
        
        console.log(`Decoded image saved to: ${decodedImagePath}`);
        return decodedImagePath;
    } catch (error) {
        console.error(`Error decoding image ${encodedImagePath}:`, error);
        return null;
    }
}

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

// Start the server
http.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    
    // Decode cur1_encoded.pngc on server start
    const encodedImagePath = path.join(__dirname, 'photos', 'cur1_encoded.pngc');
    decodeImage(encodedImagePath);
    // const decodedImagePath = path.join(__dirname, 'photos', 'cur1.png');
    // encodeImage(decodedImagePath);
});
