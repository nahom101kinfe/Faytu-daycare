
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (your website)
app.use(express.static(path.join(__dirname, 'public')));

// 🔹 MongoDB connection (REPLACE PASSWORD)
const uri = "mongodb://nahom:jocker123@ac-gn72gpo-shard-00-00.dsciie0.mongodb.net:27017,ac-gn72gpo-shard-00-01.dsciie0.mongodb.net:27017,ac-gn72gpo-shard-00-02.dsciie0.mongodb.net:27017/?ssl=true&replicaSet=atlas-bx130e-shard-0&authSource=admin&appName=Faytu-daycare";

const client = new MongoClient(uri);
let studentsCollection;
let attendanceCollection;
let paymentsCollection;

// Connect to MongoDB
async function startServer() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const db = client.db("FaytuDaycare");
    studentsCollection = db.collection("Students");
    attendanceCollection = db.collection("Attendance");
    paymentsCollection = db.collection("Payments");

    // ✅ GET students
    app.get('/students', async (req, res) => {
      const students = await studentsCollection.find({}).toArray();
      res.json(students);
    });

    // ✅ POST student
    app.post('/students', async (req, res) => {
      const student = req.body;
      const result = await studentsCollection.insertOne(student);
      res.json(result);
    });

    // ✅ DELETE student
    app.delete('/students/:fullName', async (req, res) => {
      const result = await studentsCollection.deleteOne({ fullName: req.params.fullName });
      await attendanceCollection.deleteMany({ fullName: req.params.fullName });
      await paymentsCollection.deleteMany({ fullName: req.params.fullName });
      res.json(result);
    });

    // ✅ GET attendance
    app.get('/attendance', async (req, res) => {
      const attendance = await attendanceCollection.find({}).toArray();
      res.json(attendance);
    });

    // ✅ POST attendance
    app.post('/attendance', async (req, res) => {
      const records = req.body;
      if (Array.isArray(records) && records.length > 0) {
        const result = await attendanceCollection.insertMany(records);
        res.json(result);
      } else {
        res.json({ message: "No records to insert" });
      }
    });

    // ✅ GET payments
    app.get('/payments', async (req, res) => {
      const payments = await paymentsCollection.find({}).toArray();
      res.json(payments);
    });

    // ✅ POST payments
    app.post('/payments', async (req, res) => {
      const { fullName, month, amount } = req.body;
      const result = await paymentsCollection.updateOne(
        { fullName, month },
        { $set: { amount } },
        { upsert: true }
      );
      res.json(result);
    });

    // Root route (your website)
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

startServer();

module.exports = app;