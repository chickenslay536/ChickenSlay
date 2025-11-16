const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Function to load environment variables from .env file
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        }
      }
    });
  } catch (error) {
    console.log('No .env file found or error reading it, using default values');
  }
}

// Load environment variables
loadEnv();

// Import Supabase client
const supabase = require('./supabase-client.js');

const PORT = process.env.PORT || 8000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';

// Supabase functions for user management
async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);
    
  if (error) throw error;
  
  // Return the first user if found, or null if not found
  return data && data.length > 0 ? data[0] : null;
}

async function findUserByEmailAndPassword(email, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password);
    
  if (error) throw error;
  
  // Return the first user if found, or null if not found
  return data && data.length > 0 ? data[0] : null;
}

async function updateUserGameChances(userId, gameChances) {
  const { data, error } = await supabase
    .from('users')
    .update({
      game_chances: gameChances,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();
    
  if (error) throw error;
  
  // Return the first updated user
  return data && data.length > 0 ? data[0] : null;
}

// Function to record user win
async function recordUserWin(userId) {
  const { data, error } = await supabase
    .from('users')
    .update({
      win: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();
    
  if (error) throw error;
  
  // Return the first updated user
  return data && data.length > 0 ? data[0] : null;
}

// Function to get game settings
async function getGameSettings() {
  const { data, error } = await supabase
    .from('game_settings')
    .select('*')
    .limit(1);
    
  if (error) throw error;
  
  // Return the first settings record or null
  return data && data.length > 0 ? data[0] : null;
}

// Function to update game settings
async function updateGameSettings(settings) {
  // First try to get existing settings
  let existingSettings = await getGameSettings();
  
  if (existingSettings) {
    // Update existing settings
    const { data, error } = await supabase
      .from('game_settings')
      .update({
        trial_speed: settings.trialSpeed,
        trial_precision: settings.trialPrecision,
        logged_in_speed: settings.loggedInSpeed,
        logged_in_precision: settings.loggedInPrecision,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSettings.id)
      .select();
      
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } else {
    // Create new settings record
    const { data, error } = await supabase
      .from('game_settings')
      .insert([
        {
          trial_speed: settings.trialSpeed,
          trial_precision: settings.trialPrecision,
          logged_in_speed: settings.loggedInSpeed,
          logged_in_precision: settings.loggedInPrecision,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
      
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }
}

async function findUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id);
    
  if (error) throw error;
  
  // Return the first user if found, or null if not found
  return data && data.length > 0 ? data[0] : null;
}

async function createUser(userData) {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        age_consent: userData.ageConsent,
        game_chances: 0,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select();
    
  if (error) throw error;
  
  // Return the first inserted user
  return data && data.length > 0 ? data[0] : null;
}

async function updateUserPayment(email, paymentData) {
  const { data, error } = await supabase
    .from('users')
    .update({
      upi_id: paymentData.upiId,
      utr_number: paymentData.utrNumber,
      payment_status: 'pending_approval',
      updated_at: new Date().toISOString()
    })
    .eq('email', email)
    .select();
    
  if (error) throw error;
  
  // Return the first updated user
  return data && data.length > 0 ? data[0] : null;
}

// Admin functions for managing payment requests
async function getAllPaymentRequests() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .neq('payment_status', 'pending')
    .order('updated_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

async function approveUserPayment(userId) {
  const { data, error } = await supabase
    .from('users')
    .update({
      payment_status: 'approved',
      game_chances: 3, // Give user 3 game chances after approval
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();
    
  if (error) throw error;
  
  // Return the first updated user
  return data && data.length > 0 ? data[0] : null;
}

async function denyUserPayment(userId) {
  const { data, error } = await supabase
    .from('users')
    .update({
      payment_status: 'denied',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();
    
  if (error) throw error;
  
  // Return the first updated user
  return data && data.length > 0 ? data[0] : null;
}

// Handle user registration
async function handleRegistration(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const userData = JSON.parse(body);
      
      // Validate required fields
      if (!userData.name || !userData.email || !userData.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Name, email, and password are required' }));
        return;
      }
      
      // Check if user already exists
      const existingUser = await findUserByEmail(userData.email);
      if (existingUser) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User already exists' }));
        return;
      }
      
      // Create user in Supabase
      const user = await createUser(userData);
      
      if (!user) {
        throw new Error('Failed to create user');
      }
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'User registered successfully', 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          game_chances: user.game_chances,
          payment_status: user.payment_status
        } 
      }));
    } catch (error) {
      console.error('Registration error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
    }
  });
}

// Handle user login
async function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const loginData = JSON.parse(body);
      
      // Validate required fields
      if (!loginData.email || !loginData.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email and password are required' }));
        return;
      }
      
      // Check if this is an admin login
      if (loginData.email === 'nimaun@123' && loginData.password === 'sulesamaj123*') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Admin login successful',
          isAdmin: true
        }));
        return;
      }
      
      // Check if user exists with matching email and password
      const user = await findUserByEmailAndPassword(loginData.email, loginData.password);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid email or password' }));
        return;
      }
      
      // Check if user has approved payment status
      if (user.payment_status !== 'approved') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payment not approved. Please complete payment process.' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Login successful', 
        isAdmin: false,
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          game_chances: user.game_chances,
          payment_status: user.payment_status
        } 
      }));
    } catch (error) {
      console.error('Login error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
    }
  });
}

// Handle updating user game chances
async function handleUpdateGameChances(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const updateData = JSON.parse(body);
      
      // Validate required fields
      if (!updateData.userId || updateData.gameChances === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User ID and game chances are required' }));
        return;
      }
      
      // Update user game chances in Supabase
      const updatedUser = await updateUserGameChances(updateData.userId, updateData.gameChances);
      
      if (!updatedUser) {
        throw new Error('Failed to update user game chances');
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Game chances updated successfully', 
        user: updatedUser 
      }));
    } catch (error) {
      console.error('Update game chances error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
    }
  });
}

// Handle recording user win
async function handleRecordWin(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const winData = JSON.parse(body);
      
      // Validate required fields
      if (!winData.userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User ID is required' }));
        return;
      }
      
      // Record user win in Supabase
      const updatedUser = await recordUserWin(winData.userId);
      
      if (!updatedUser) {
        throw new Error('Failed to record user win');
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Win recorded successfully', 
        user: updatedUser 
      }));
    } catch (error) {
      console.error('Record win error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
    }
  });
}

// Handle getting game settings
async function handleGetGameSettings(req, res) {
  try {
    const settings = await getGameSettings();
    
    // If no settings exist, return defaults
    if (!settings) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        trialSpeed: 10,
        trialPrecision: 1,
        loggedInSpeed: 10,
        loggedInPrecision: 1
      }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      trialSpeed: settings.trial_speed,
      trialPrecision: settings.trial_precision,
      loggedInSpeed: settings.logged_in_speed,
      loggedInPrecision: settings.logged_in_precision
    }));
  } catch (error) {
    console.error('Get game settings error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
  }
}

// Handle updating game settings
async function handleUpdateGameSettings(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const settingsData = JSON.parse(body);
      
      // Validate required fields
      if (settingsData.trialSpeed === undefined || settingsData.trialPrecision === undefined ||
          settingsData.loggedInSpeed === undefined || settingsData.loggedInPrecision === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'All settings fields are required' }));
        return;
      }
      
      // Update game settings in Supabase
      const updatedSettings = await updateGameSettings(settingsData);
      
      if (!updatedSettings) {
        throw new Error('Failed to update game settings');
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Game settings updated successfully', 
        settings: {
          trialSpeed: updatedSettings.trial_speed,
          trialPrecision: updatedSettings.trial_precision,
          loggedInSpeed: updatedSettings.logged_in_speed,
          loggedInPrecision: updatedSettings.logged_in_precision
        }
      }));
    } catch (error) {
      console.error('Update game settings error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
    }
  });
}

// Handle payment submission
async function handlePayment(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const paymentData = JSON.parse(body);
      
      // Validate required fields
      if (!paymentData.email || !paymentData.upiId || !paymentData.utrNumber) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email, UPI ID, and UTR number are required' }));
        return;
      }
      
      // Check if user exists
      const user = await findUserByEmail(paymentData.email);
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      
      // Update user with payment information
      const updatedUser = await updateUserPayment(paymentData.email, paymentData);
      
      if (!updatedUser) {
        throw new Error('Failed to update user payment information');
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Payment submitted successfully', 
        user: { 
          id: updatedUser.id, 
          name: updatedUser.name, 
          email: updatedUser.email,
          game_chances: updatedUser.game_chances,
          payment_status: updatedUser.payment_status
        } 
      }));
    } catch (error) {
      console.error('Payment error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
    }
  });
}

// Handle user status check
async function handleUserStatus(req, res) {
  const url = require('url');
  const parsedUrl = url.parse(req.url, true);
  const email = parsedUrl.query.email;
  
  if (!email) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Email is required' }));
    return;
  }
  
  try {
    const user = await findUserByEmail(email);
    
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: user.payment_status,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        game_chances: user.game_chances,
        payment_status: user.payment_status
      } 
    }));
  } catch (error) {
    console.error('User status error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
  }
}

// Admin API endpoints
async function handleGetRequests(req, res) {
  try {
    // In a real implementation, you would verify admin authentication
    // For this demo, we'll allow access without authentication
    
    const requests = await getAllPaymentRequests();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ requests }));
  } catch (error) {
    console.error('Admin requests error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
  }
}

async function handleApproveRequest(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      // In a real implementation, you would verify admin authentication
      // For this demo, we'll allow access without authentication
      
      const requestData = JSON.parse(body);
      
      if (!requestData.userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User ID is required' }));
        return;
      }
      
      const updatedUser = await approveUserPayment(requestData.userId);
      
      if (!updatedUser) {
        throw new Error('Failed to approve user payment');
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Payment approved successfully', 
        user: updatedUser 
      }));
    } catch (error) {
      console.error('Admin approve error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
    }
  });
}

async function handleDenyRequest(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      // In a real implementation, you would verify admin authentication
      // For this demo, we'll allow access without authentication
      
      const requestData = JSON.parse(body);
      
      if (!requestData.userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User ID is required' }));
        return;
      }
      
      const updatedUser = await denyUserPayment(requestData.userId);
      
      if (!updatedUser) {
        throw new Error('Failed to deny user payment');
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Payment denied successfully', 
        user: updatedUser 
      }));
    } catch (error) {
      console.error('Admin deny error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }));
    }
  });
}

// Add CORS headers function
function addCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Modify the server request handler to add API endpoints and handle CORS
const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Add CORS headers to all responses
  addCorsHeaders(res);
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse the request URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Handle API endpoints
  if (pathname === '/api/register' && req.method === 'POST') {
    handleRegistration(req, res);
    return;
  }
  
  if (pathname === '/api/login' && req.method === 'POST') {
    handleLogin(req, res);
    return;
  }
  
  if (pathname === '/api/user/update-chances' && req.method === 'POST') {
    handleUpdateGameChances(req, res);
    return;
  }
  
  if (pathname === '/api/user/win' && req.method === 'POST') {
    handleRecordWin(req, res);
    return;
  }
  
  if (pathname === '/api/settings' && req.method === 'GET') {
    handleGetGameSettings(req, res);
    return;
  }
  
  if (pathname === '/api/settings' && req.method === 'POST') {
    handleUpdateGameSettings(req, res);
    return;
  }
  
  if (pathname === '/api/payment' && req.method === 'POST') {
    handlePayment(req, res);
    return;
  }
  
  // User API endpoints
  if (pathname === '/api/user/status' && req.method === 'GET') {
    handleUserStatus(req, res);
    return;
  }
  
  // Admin API endpoints
  if (pathname === '/api/admin/requests' && req.method === 'GET') {
    handleGetRequests(req, res);
    return;
  }
  
  if (pathname === '/api/admin/approve' && req.method === 'POST') {
    handleApproveRequest(req, res);
    return;
  }
  
  if (pathname === '/api/admin/deny' && req.method === 'POST') {
    handleDenyRequest(req, res);
    return;
  }
  
  // Default to index.html if requesting root
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Construct the file path
  const filePath = path.join(process.cwd(), pathname);
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`File not found: ${filePath}`);
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    // Get file extension
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.log(`Error reading file: ${filePath}`, err);
        res.writeHead(500);
        res.end('Internal server error');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const interfaces = require('os').networkInterfaces();
  let addresses = [];
  
  for (let k in interfaces) {
    for (let k2 in interfaces[k]) {
      let address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }
  
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Access from other devices on your network:`);
  addresses.forEach(addr => {
    console.log(`  http://${addr}:${PORT}/`);
  });
});