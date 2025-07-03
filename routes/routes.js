const express = require('express');
const mongoose = require('mongoose');
const Semester = require('../model/Semester');
const Subject = require('../model/Subject');
const PDF = require('../model/PDF');
const multer = require('multer');
// const { GridFsStorage } = require('multer-gridfs-storage');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');
const dbconnect = require('../config/conn');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

dbconnect();
const conn = mongoose.connection;

let gfsBucket;

conn.once('open', () => {
  gfsBucket = new GridFSBucket(conn.db, { bucketName: 'pdfs' });
  console.log('Connected to MongoDB and GridFS ready');
});

// GET all semesters
router.get('/semesters', async (req, res) => {
  try {
    const semesters = await Semester.find();
    res.json(semesters);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET subjects of a semester
router.get('/semesters/:id/subjects', async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id).populate('subjects');
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    res.json(semester.subjects);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all PDFs under a subject
// GET all PDFs under a subject
router.get('/subjects/:subjectId/pdfs', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId).populate({
      path: 'pdfs',
      select: '_id title gridFsFileId'  // 🛠 CHANGED: added gridFsFileId
    });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject.pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Upload PDF and link to subject and semester
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, semesterName, subjectName } = req.body;

    if (!req.file) return res.status(400).send('File upload failed.');

 const readableStream = new Readable();
readableStream.push(req.file.buffer);
readableStream.push(null);

const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
  contentType: req.file.mimetype
});
const fileId = uploadStream.id; // ← Capture the ID here

readableStream.pipe(uploadStream)
  .on('error', () => res.status(500).send('Upload error'))
  .on('finish', async () => {
    let semester = await Semester.findOne({ name: semesterName });
    if (!semester) {
      semester = new Semester({ name: semesterName });
      await semester.save();
    }

    let subject = await Subject.findOne({ name: subjectName, semester: semester._id });
    if (!subject) {
      subject = new Subject({ name: subjectName, semester: semester._id });
      await subject.save();
      semester.subjects.push(subject._id);
      await semester.save(); 
    }

    const newPdf = new PDF({
      title,
      gridFsFileId: fileId, // Use the captured ID
      subject: subject._id
    });
    await newPdf.save();

    subject.pdfs.push(newPdf._id);
    await subject.save();
    
    res.redirect('/');
  });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).send('Failed to upload PDF.');
  }
});

// GET: Download PDF file from GridFS
router.get('/pdfs/:id/download', async (req, res) => {
  try {
    const fileId = req.params.id;

    // 🛠 CHANGED: Safe ObjectId check
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const fileObjId = new mongoose.Types.ObjectId(fileId);
    const files = await conn.db.collection('pdfs.files').findOne({ _id: fileObjId });

    if (!files || (files.contentType && files.contentType !== 'application/pdf')) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${files.filename}"`
    });

    gfsBucket.openDownloadStream(fileObjId).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
