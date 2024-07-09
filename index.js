import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import userRoute from './routes/users.js';
import authRoute from './routes/auth.js';
import postRoute from './routes/posts.js';

// Get __dirname equivalent for ES modules
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:3000', 
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
}));

app.use(express.json());
app.use(helmet());
app.use(morgan('common'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

app.use('/images', express.static(path.join(__dirname, 'public/images')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        res.status(200).json('file uploaded');
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error uploading file.' });
    }
});

app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);

app.get('/', (req, res) => {
    res.send('Welcome to age');
});

app.listen(process.env.PORT || 8800, () => {
    console.log('Backend Server initiated');
});
