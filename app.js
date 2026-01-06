const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
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

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes Imports
const userRoutes = require('./api/route/userRoutes');
const carePlanningRoutes = require('./api/route/carePlanningRoutes');
const clientRoutes = require('./api/route/clientRoutes');
const compliance = require('./api/route/compliance');
const hr = require('./api/route/hr');
const incident = require('./api/route/incident');
const training = require('./api/route/training');
const socialActivityRoutes = require("./api/route/socialActivity");
const analytics = require('./api/route/analytics');
const performanceRoutes = require("./api/route/performance");
const StaffDocumentRoutes = require('./api/route/staffDocuments');
const templateRoutes = require('./api/route/templateRoutes');
const staffPayRoutes = require('./api/route/staffPay');
const shiftsRoutes = require('./api/route/shifts');

// New Feature Routes
const pbsPlanRoutes = require('./api/route/pbsPlanRoutes');
const riskAssessmentRoutes = require('./api/route/riskAssessmentRoutes');
const goalRoutes = require('./api/route/goalRoutes');
const dailyLogRoutes = require('./api/route/dailyLogRoutes');
const consentRoutes = require('./api/route/consentRoutes');
const handoverRoutes = require('./api/route/handoverRoutes');
const medicationRoutes = require('./api/route/medicationRoutes');
const medicationAdministrationRoutes = require('./api/route/medicationAdministrationRoutes');

// Route Registrations
app.use('/shifts', shiftsRoutes);
app.use('/staffpay', staffPayRoutes);
app.use('/templates', templateRoutes);
app.use('/staff-documents', StaffDocumentRoutes);
app.use("/performance", performanceRoutes);
app.use("/social", socialActivityRoutes);
app.use('/training', training);
app.use('/incident', incident);
app.use('/hr', hr);
app.use('/compliance', compliance);
app.use('/client', clientRoutes);
app.use('/user', userRoutes);
app.use('/carePlanning', carePlanningRoutes);
app.use("/analytics", analytics);

// New Feature Registrations
app.use('/pbs-plan', pbsPlanRoutes);
app.use('/risk-assessment', riskAssessmentRoutes);
app.use('/goals', goalRoutes);
app.use('/daily-log', dailyLogRoutes);
app.use('/consent', consentRoutes);
app.use('/handover', handoverRoutes);

// Medication Routes (Replacing old logic)
app.use('/medication', medicationRoutes);
app.use('/medications', medicationRoutes); // Alias for frontend compatibility
app.use('/medication-administration', medicationAdministrationRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ msg: "Not found" });
});

module.exports = app;
