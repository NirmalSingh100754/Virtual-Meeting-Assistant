const mongoose = require('mongoose');

// Define a schema for storing meeting data
const meetingSchema = new mongoose.Schema({
  fullTranscript: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a model from the schema
const Meeting = mongoose.model('Meeting', meetingSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/ai-meeting-assistant', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Export the Meeting model and connectDB function
module.exports = {
  Meeting,
  connectDB
};