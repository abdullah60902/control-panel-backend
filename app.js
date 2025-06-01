const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');

const app = express();

// MongoDB connection (direct, no .env)
mongoose.connect('mongodb+srv://abdullah0123:12345678iman@cluster0.ik5f94l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

mongoose.connection.on('error', (error) => {
    console.log('MongoDB connection failed:', error);
});
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
});

// File upload directory
const uploadDir = '/tmp';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(fileUpload({ useTempFiles: true, tempFileDir: uploadDir }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
const userRoutes = require('./api/route/userRoutes');
const carePlanningRoutes = require('./api/route/carePlanningRoutes');
const clientRoutes = require('./api/route/clientRoutes');
const compliance = require('./api/route/compliance');
const hr = require('./api/route/hr');
 const incident = require('./api/route/incident');
const training = require('./api/route/training');

app.use('/training', training);
app.use('/incident', incident);
app.use('/hr', hr);
app.use('/compliance', compliance);
app.use('/client', clientRoutes);
app.use('/user', userRoutes);
app.use('/carePlanning', carePlanningRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ msg: "Not found" });
});

module.exports = app;
