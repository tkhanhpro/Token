const express = require('express');
const cors = require('cors');
const path = require('path');
const { getTokenByType, getAllTokens, getTokenTypes, APP_IDS } = require('./token');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint duy nhất: /api/token
app.get('/api/token', async (req, res) => {
  try {
    const { cookie, type } = req.query;

    if (!cookie) {
      return res.status(400).json({
        message: 'Thiếu cookie',
        code: 400,
        token: null,
        cookie: null
      });
    }

    if (!type) {
      return res.status(400).json({
        message: 'Thiếu loại token',
        code: 400,
        token: null,
        cookie: null
      });
    }

    // Decode cookie từ URL
    const decodedCookie = decodeURIComponent(cookie);

    if (type.toUpperCase() === 'ALL') {
      // Lấy tất cả token
      const tokens = await getAllTokens(decodedCookie);
      const successfulTokens = Object.values(tokens).filter(token => token !== null).length;
      
      return res.json({
        message: `Lấy được ${successfulTokens}/${Object.keys(tokens).length} token`,
        code: 200,
        tokens: tokens,
        cookie: decodedCookie,
        total: Object.keys(tokens).length,
        successful: successfulTokens
      });
    } else {
      // Lấy token theo loại
      const result = await getTokenByType(type.toUpperCase(), decodedCookie);
      
      res.json({
        tokenType: type.toUpperCase(),
        ...result,
        cookie: decodedCookie
      });
    }

  } catch (error) {
    console.error('Error getting token:', error);
    res.status(500).json({
      message: 'Lỗi server',
      code: 500,
      token: null,
      cookie: null,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Lấy danh sách loại token
app.get('/api/token-types', (req, res) => {
  res.json({
    message: 'Available token types',
    tokenTypes: getTokenTypes(),
    total: getTokenTypes().length
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Endpoint: GET /api/token?cookie={cookie}&type={tokenType}`);
  console.log(`Available token types: ${getTokenTypes().join(', ')}`);
});
