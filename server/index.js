const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const morgan = require('morgan'); // For request logging

const { summarizeWithGemini } = require('./geminimodel');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(morgan('dev')); // Log requests

const secretKey = 'b^sT8u9A$zYw2qR1pL*7o&5xH3iKcVgXf@'; // Secret key for JWT
const apiKey = 'Your News API Key'; // API key for NewsAPI

// Connect to MongoDB
mongoose.connect('Your Mongodb url', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define NewsSchema
const newsSchema = new mongoose.Schema({
  title: String,
  description: String,
  url: String,
  imageUrl: String,
  category: String,
}, { timestamps: true });

const News = mongoose.model('News', newsSchema);

// User Schema
const User = mongoose.model('User', {
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  preferences: [String],
});

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  article: {
    title: String,
    description: String,
    url: String,
    imageUrl: String,
    category: String,
  },
}, { timestamps: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

app.post('/api/bookmarks', async (req, res) => {
  try {
    const { userId, article } = req.body;

    if (!userId || !article) {
      return res.status(400).json({ error: 'User ID and article are required' });
    }

    const bookmark = new Bookmark({ userId, article });
    await bookmark.save();
    res.status(201).json({ message: 'Bookmark saved successfully!' });
  } catch (error) {
    console.error('Error saving bookmark:', error);
    res.status(500).json({ error: 'Error saving bookmark. Please try again later.' });
  }
});

app.get('/api/bookmarks', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find().populate('userId');
    res.status(200).json(bookmarks);
  } catch (error) {
    console.error('Error retrieving bookmarks:', error);
    res.status(500).json({ error: 'Error retrieving bookmarks. Please try again later.' });
  }
});

app.post('/register', async (req, res) => {
  const { username, password, preferences } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, preferences });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    jwt.sign({ username: user.username, userId: user._id }, secretKey, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        console.error('Error generating token:', err);
        return res.status(500).json({ error: 'Error logging in' });
      }

      res.json({ token, user: { username: user.username, userId: user._id, preferences: user.preferences } });
    });
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
    const timestamp = req.query.timestamp || new Date().getTime();

    const apiUrl = `https://newsapi.org/v2/top-headlines?country=in&pageSize=9&apiKey=${apiKey}&timestamp=${timestamp}`;

    const newsData = await Promise.all(
      categories.map(async (category) => {
        const response = await axios.get(`${apiUrl}&category=${category}`);
        return response.data.articles.map(article => ({
          title: article.title,
          description: article.content,
          url: article.url,
          imageUrl: article.urlToImage,
          category,
        }));
      })
    );

    const flattenedNewsData = newsData.flat();

    // Save news data to MongoDB
    await News.insertMany(flattenedNewsData, { ordered: false }); // Avoid errors if documents already exist

    res.json(flattenedNewsData);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/scrape', async (req, res) => {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
  };

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);

    const titleElement = $('title');
    const title = titleElement.text().trim();
    const relatedContent = titleElement.closest('head').text().trim();
    const articleBodyMatch = relatedContent.match(/"articleBody"\s*:\s*"([^"]*)"/);
    const articleBody = articleBodyMatch ? articleBodyMatch[1] : '';

    const summary = await summarizeWithGemini(articleBody);

    res.json({ title, articleBody, summary });
  } catch (error) {
    console.error('Error scraping data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
