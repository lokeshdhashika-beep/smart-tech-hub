const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Ensure Database Exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

// Read All Data
app.get('/api/db', (req, res) => {
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        res.json(JSON.parse(raw));
    } catch (err) {
        console.error("DB Read Error:", err);
        res.status(500).json({ error: 'Failed to read DB' });
    }
});

// Update Specific Key
app.post('/api/db/:key', (req, res) => {
    try {
        const key = req.params.key;
        const value = req.body;
        
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        data[key] = value; // Merge the specific key (e.g., sth_orders)
        
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (err) {
        console.error("DB Write Error:", err);
        res.status(500).json({ error: 'Failed to write DB' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
