const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const bodyParser = require('body-parser');
const { summarizeWithChatGPT } = require('./summarizer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const secretKey = 'b^sT8u9A$zYw2qR1pL*7o&5xH3iKcVgXf@';
// Connect to MongoDB
mongoose.connect('mongodb+srv://pavankumart:<password>@cluster0.b6dce5l.mongodb.net/NewsDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define NewsSchema
const newsSchema = new mongoose.Schema({
  title: String,
  description: String,
  url: String,
  imageUrl: String,
  category: String,
});

const News = mongoose.model('News', newsSchema);
// User Schema
const User = mongoose.model('User', {
  username: String,
  password: String,
  preferences:[String]
});

const bookmarkSchema = new mongoose.Schema({
  userId: String,
  article: Object,
});

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
app.post('/api/bookmarks', async (req, res) => {
  try {
    const { userId, article } = req.body;
    console.log(req.body)
    const bookmark = new Bookmark({ userId, article });
    await bookmark.save();
    res.status(200).json({ message: 'Bookmark saved successfully!' });
  } catch (error) {
    console.error('Error saving bookmark:', error);
    res.status(500).json({ error: 'Error saving bookmark. Please try again later.' });
  }
});
app.get('/api/bookmarks', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find();
    console.log(bookmarks)
    res.status(200).json(bookmarks);
  } catch (error) {
    console.error('Error retrieving bookmarks:', error);
    res.status(500).json({ error: 'Error retrieving bookmarks. Please try again later.' });
  }
});

app.post('/register', async (req, res) => {
  console.log(req.body);
  const { username, password,preferences } = req.body;
  console.log(req.body)

  // Hash the password before saving it to the database
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    password: hashedPassword,
    preferences
  });

  try {
    await newUser.save();
    res.status(200).send('User registered successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
  }
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    jwt.sign({ username: user.username }, secretKey, {
      expiresIn: '1h', // 1 hour expiration
    }, (err, token) => {
      if (err) {
        console.error('Error generating token:', err);
        return res.status(500).json({ error: 'Error logging in' });
      }

      console.log('Generated token:', token);
      res.json({ token, user: { username: user.username, userId: user._id, preferences: user.preferences } });
    });
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});
// API endpoint to fetch news based on the country (India)
app.get('/api/news', async (req, res) => {
  try {
    const apiKey = '75bb66e0a8e64e98a4a5c1bdfdad2325';
    const categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
    
    // Use the provided timestamp or current timestamp
    const timestamp = req.query.timestamp || new Date().getTime();

    // Append timestamp to the URL to prevent caching
    const apiUrl = `https://newsapi.org/v2/top-headlines?country=in&pageSize=9&apiKey=${apiKey}&timestamp=${timestamp}`;

    // Fetch and save 10 news articles for each category from India
    const newsData = await Promise.all(
      categories.map(async category => {
        const response = await axios.get(`${apiUrl}&category=${category}`);
        return response.data.articles.map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.urlToImage,
          category: category,
        }));
      })
    );

    // Flatten the array
    const flattenedNewsData = newsData.flat();

    // Save news data to MongoDB
    await News.insertMany(flattenedNewsData);

    res.json(flattenedNewsData);
  } catch (error) {
    console.error(error);
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

    // Extract title and related content
    const titleElement = $('title');
    const title = titleElement.text().trim();
    const relatedContent = titleElement.closest('head').text().trim();
    const articleBodyMatch = relatedContent.match(/"articleBody"\s*:\s*"([^"]*)"/);
    const articleBody = articleBodyMatch ? articleBodyMatch[1] : '';

    // Send the article body to the summarizer
    const summary = await summarizeWithChatGPT(articleBody);

    res.json({ title, articleBody, summary });
  } catch (error) {
    console.error('Error scraping data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
