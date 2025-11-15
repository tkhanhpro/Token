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

// API Routes
app.get('/api/token-types', (req, res) => {
  res.json({
    message: 'Available token types',
    tokenTypes: getTokenTypes(),
    total: getTokenTypes().length
  });
});

// Lấy token theo loại
app.post('/api/token/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { cookie } = req.body;

    if (!cookie) {
      return res.status(400).json({
        message: 'Thiếu cookie',
        code: 400,
        token: null
      });
    }

    const result = await getTokenByType(type.toUpperCase(), cookie);
    
    res.json({
      tokenType: type.toUpperCase(),
      ...result
    });

  } catch (error) {
    console.error('Error getting token:', error);
    res.status(500).json({
      message: 'Lỗi server',
      code: 500,
      token: null,
      error: error.message
    });
  }
});

// Lấy tất cả các token
app.post('/api/tokens/all', async (req, res) => {
  try {
    const { cookie } = req.body;

    if (!cookie) {
      return res.status(400).json({
        message: 'Thiếu cookie',
        code: 400,
        tokens: null
      });
    }

    const tokens = await getAllTokens(cookie);
    
    // Đếm số token thành công
    const successfulTokens = Object.values(tokens).filter(token => token !== null).length;
    
    res.json({
      message: `Lấy được ${successfulTokens}/${Object.keys(tokens).length} token`,
      code: 200,
      tokens: tokens,
      total: Object.keys(tokens).length,
      successful: successfulTokens
    });

  } catch (error) {
    console.error('Error getting all tokens:', error);
    res.status(500).json({
      message: 'Lỗi server',
      code: 500,
      tokens: null,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Available token types: ${getTokenTypes().join(', ')}`);
});
