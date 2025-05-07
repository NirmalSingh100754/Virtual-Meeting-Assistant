const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, Meeting } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to DB
connectDB();
let cor_object={
  origin:'http://localhost:5001',
  methods:'GET,POST,PATCH,DELETE',
  Credential:true
}
app.use(cors(cor_object));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API route to save meeting transcript and summary
app.post('/api/save-meeting', async (req, res) => {
  const { transcript, summary } = req.body;

  try {
    const meeting = new Meeting({
      fullTranscript: transcript,
      summary: summary
    });

    await meeting.save();
    res.status(201).json({ message: 'Meeting saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save meeting' });
  }
});
// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});