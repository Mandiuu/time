// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 8000;

// Enable serving static files (HTML, CSS, etc.)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public'))); // This line goes here

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Provide the environment variables to the frontend
app.get('/config', (req, res) => {
    res.json({
        MAPBOX_API_KEY: process.env.MAPBOX_API_KEY,
        TIMEZONEDB_API_KEY: process.env.TIMEZONEDB_API_KEY
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
