const express = require('express');
const app = express();
const connectDB = require('./db');
const bodyParser = require('body-parser');
const path = require('path'); 
const User = require('./models/User');
const adminRegister = require('./routes/admin/register');
const adminLogin = require('./routes/admin/login');
const cors = require('cors');
const adminRoutes = require('./routes/admin/admin');
const authMiddleware = require('./middlewares/auth');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_BASE_URL,
  credentials: true, // if you're using cookies or need credentials
}));
app.use('/admin', adminRegister);
app.use('/admin', adminLogin);
app.use('/admin', adminRoutes);

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}); 