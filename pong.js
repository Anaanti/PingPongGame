// Initialize canvas and context
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

// Game states
const GAME_STATE = {
  LOGIN: 0,
  START: 1,
  PLAYING: 2,
  GAME_OVER: 3
};

// Soothing color palette
const COLORS = {
  background: '#2c3e50',      // Dark blue slate
  backgroundAlt: '#34495e',   // Slightly lighter blue slate
  primary: '#3498db',         // Soft blue
  secondary: '#2ecc71',       // Soft green
  accent: '#9b59b6',          // Soft purple
  light: '#ecf0f1',           // Off-white
  warning: '#f39c12',         // Soft orange
  danger: '#e74c3c',          // Soft red
  dark: '#1a2530',            // Very dark blue
  transparentDark: 'rgba(26, 37, 48, 0.7)'  // Transparent dark blue
};

// Game variables
let currentState = GAME_STATE.LOGIN;
let username = '';
let score = 0;
let highScore = 0;
let lastFrameTime = 0;
let backgroundPattern = [];
let cursorBlink = true;
let cursorBlinkTimer = 0;

// User registration system
let registeredUsers = {};
let loginMessage = '';
let loginMessageTimer = 0;

// Difficulty system
let currentDifficulty = 1;
let difficultyTimer = 0;
const DIFFICULTY_INTERVAL = 30000; // Increase difficulty every 30 seconds
let showDifficultyPopup = false;
let difficultyPopupTimer = 0;
const POPUP_DURATION = 2000; // Show popup for 2 seconds

// Background theme variables for different difficulties
let currentTheme = 'default';
const themes = {
  default: {
    background: COLORS.background,
    backgroundAlt: COLORS.backgroundAlt,
    starsColor: '#ffffff',
    ballDesign: 'cosmic'
  },
  level2: {
    background: '#1a2639',
    backgroundAlt: '#2d3f5a',
    starsColor: '#89cff0',
    ballDesign: 'cosmic'
  },
  level3: {
    background: '#2d1a39',
    backgroundAlt: '#462659',
    starsColor: '#e0aaff',
    ballDesign: 'trail'
  },
  level4: {
    background: '#4a1a1a',
    backgroundAlt: '#6a292b',
    starsColor: '#ffaa77',
    ballDesign: 'trail'
  }
};

// Load user data from localStorage if available
function loadUserData() {
  const savedUsers = localStorage.getItem('pongUsers');
  if (savedUsers) {
    registeredUsers = JSON.parse(savedUsers);
  }
  
  const savedHighScore = localStorage.getItem('pongHighScore');
  if (savedHighScore) {
    highScore = parseInt(savedHighScore);
  }
}
loadUserData();

// Save user data to localStorage
function saveUserData() {
  localStorage.setItem('pongUsers', JSON.stringify(registeredUsers));
  localStorage.setItem('pongHighScore', highScore.toString());
}

// Generate background pattern stars
function generateBackgroundPattern() {
  backgroundPattern = [];
  for (let i = 0; i < 100; i++) {
    backgroundPattern.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * 0.05 + 0.01
    });
  }
}
generateBackgroundPattern();

// Paddle and Ball positions
let paddle = {
  x: 400,
  y: 580,
  width: 100,
  height: 15,
  speed: 8,
  dx: 0
};

let ball = {
  x: 400,
  y: 300,
  radius: 8,
  dx: 5,
  dy: 5,
  speed: 5,
  rotation: 0,
  rotationSpeed: 0.05,
  design: 'cosmic' // Options: 'basic', 'cosmic', 'trail'
};

// Trail effect for ball
let ballTrail = [];
const MAX_TRAIL_LENGTH = 10;

// Input handling
const keys = {};

// Fonts
let fontsLoaded = false;
const gameFont = new FontFace('Orbitron', 'url(https://fonts.gstatic.com/s/orbitron/v29/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWgz.woff2)');
const titleFont = new FontFace('Audiowide', 'url(https://fonts.gstatic.com/s/audiowide/v16/l7gdbjpo0cum0ckerWCdmA_OIxo.woff2)');

// Load fonts
Promise.all([gameFont.load(), titleFont.load()]).then(fonts => {
  fonts.forEach(font => document.fonts.add(font));
  fontsLoaded = true;
});

// Event listeners
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  
  // Handle text input for login
  if (currentState === GAME_STATE.LOGIN) {
    if (e.key.length === 1 && username.length < 15) {
      username += e.key;
      cursorBlink = true; // Reset cursor blink on typing
    } else if (e.key === 'Backspace') {
      username = username.slice(0, -1);
      cursorBlink = true; // Reset cursor blink on typing
    } else if (e.key === 'Enter' && username.trim().length > 0) {
      handleLogin();
    }
  } else if (currentState === GAME_STATE.START && e.key === 'Enter') {
    startGame();
  } else if (currentState === GAME_STATE.GAME_OVER && e.key === 'r') {
    resetGame();
    currentState = GAME_STATE.PLAYING;
  } else if (e.key === 'Escape') {
    // Logout
    if (currentState !== GAME_STATE.LOGIN) {
      username = '';
      currentState = GAME_STATE.LOGIN;
    }
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

canvas.addEventListener('click', (e) => {
 const rect = canvas.getBoundingClientRect();
 const mouseX = e.clientX - rect.left;
 const mouseY = e.clientY - rect.top;

 // Login button
 if (currentState === GAME_STATE.LOGIN) {
   // Fixed coordinates for the login button
   const loginButton = {
     x: canvas.width / 2 - 100,
     y: canvas.height / 2 - 10, // Changed from canvas.height / 2 + 50
     width: 200,
     height: 50
   };
   
   if (mouseX >= loginButton.x && mouseX <= loginButton.x + loginButton.width &&
       mouseY >= loginButton.y && mouseY <= loginButton.y + loginButton.height) {
     if (username.trim().length > 0) {
       handleLogin();
     }
   }

   // Register button - also need to update these coordinates
   const registerButton = {
     x: canvas.width / 2 - 100,
     y: canvas.height / 2 + 60, // Changed from canvas.height / 2 + 120
     width: 200,
     height: 50
   };
   
   if (mouseX >= registerButton.x && mouseX <= registerButton.x + registerButton.width &&
       mouseY >= registerButton.y && mouseY <= registerButton.y + registerButton.height) {
     if (username.trim().length > 0) {
       handleRegistration();
     }
   }
 }
  // Play again button
  if (currentState === GAME_STATE.GAME_OVER) {
   const playAgainButton = {
     x: canvas.width / 2 - 100,
     y: canvas.height / 2 + 50,
     width: 200,
     height: 50
   };
   
   if (mouseX >= playAgainButton.x && mouseX <= playAgainButton.x + playAgainButton.width &&
       mouseY >= playAgainButton.y && mouseY <= playAgainButton.y + playAgainButton.height) {
     resetGame();
     currentState = GAME_STATE.PLAYING;
   }
 }
});

// Login and registration system
function handleLogin() {
  if (username.trim().length === 0) {
    loginMessage = 'Please enter a username';
    loginMessageTimer = 3000;
    return;
  }
  
  if (registeredUsers[username]) {
    // User exists
    currentState = GAME_STATE.START;
    highScore = Math.max(highScore, registeredUsers[username].highScore || 0);
  } else {
    // User doesn't exist
    loginMessage = 'Invalid credentials. Please register first.';
    loginMessageTimer = 3000;
  }
}

function handleRegistration() {
  if (username.trim().length === 0) {
    loginMessage = 'Please enter a username';
    loginMessageTimer = 3000;
    return;
  }
  
  if (registeredUsers[username]) {
    // User already exists
    loginMessage = 'Username already registered. Please login.';
    loginMessageTimer = 3000;
  } else {
    // New user
    registeredUsers[username] = {
      registered: true,
      highScore: 0
    };
    saveUserData();
    loginMessage = 'Registration successful! You can now login.';
    loginMessageTimer = 3000;
  }
}

// Game functions
function startGame() {
  resetGame();
  currentState = GAME_STATE.PLAYING;
}

function resetGame() {
  score = 0;
  currentDifficulty = 1;
  difficultyTimer = 0;
  showDifficultyPopup = false;
  currentTheme = 'default';
  ball.design = themes['default'].ballDesign;
  
  paddle.x = canvas.width / 2 - paddle.width / 2;
  paddle.width = 100; // Reset paddle width
  paddle.speed = 8;   // Reset paddle speed
  
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -ball.speed;
  ball.speed = 5;     // Reset ball speed
  ballTrail = [];
}

function updateCursorBlink(deltaTime) {
  cursorBlinkTimer += deltaTime;
  if (cursorBlinkTimer > 500) { // Blink every 500ms
    cursorBlink = !cursorBlink;
    cursorBlinkTimer = 0;
  }
}

function updateLoginMessage(deltaTime) {
  if (loginMessageTimer > 0) {
    loginMessageTimer -= deltaTime;
  }
}

function updateDifficulty(deltaTime) {
  if (currentState === GAME_STATE.PLAYING) {
    difficultyTimer += deltaTime;
    
    // Check if it's time to increase difficulty
    if (difficultyTimer >= DIFFICULTY_INTERVAL && currentDifficulty < 4) {
      currentDifficulty++;
      difficultyTimer = 0;
      
      // Show difficulty popup
      showDifficultyPopup = true;
      difficultyPopupTimer = POPUP_DURATION;
      
      // Update game mechanics based on difficulty
      updateGameMechanics();
      
      // Update theme
      if (currentDifficulty === 2) {
        currentTheme = 'level2';
      } else if (currentDifficulty === 3) {
        currentTheme = 'level3';
      } else if (currentDifficulty === 4) {
        currentTheme = 'level4';
      }
      
      // Update ball design based on theme
      ball.design = themes[currentTheme].ballDesign;
    }
    
    // Update difficulty popup timer
    if (showDifficultyPopup) {
      difficultyPopupTimer -= deltaTime;
      if (difficultyPopupTimer <= 0) {
        showDifficultyPopup = false;
      }
    }
  }
}

function updateGameMechanics() {
  // Increase ball speed by 20% each difficulty level
  const speedMultiplier = 1.2;
  ball.dx *= speedMultiplier;
  ball.dy *= speedMultiplier;
  
  // Increase paddle speed slightly to help player
  paddle.speed += 1;
  
  // Make paddle smaller at higher difficulties
  if (currentDifficulty >= 3) {
    paddle.width = Math.max(40, paddle.width - 20);
  }
}

function updatePaddle() {
  // Keyboard controls
  if (keys['ArrowLeft'] || keys['a']) {
    paddle.dx = -paddle.speed;
  } else if (keys['ArrowRight'] || keys['d']) {
    paddle.dx = paddle.speed;
  } else {
    paddle.dx = 0;
  }

  // Update paddle position
  paddle.x += paddle.dx;

  // Keep paddle on screen
  if (paddle.x < 0) {
    paddle.x = 0;
  } else if (paddle.x + paddle.width > canvas.width) {
    paddle.x = canvas.width - paddle.width;
  }
}

function updateBall() {
  // Update trail
  ballTrail.unshift({ x: ball.x, y: ball.y, radius: ball.radius });
  if (ballTrail.length > MAX_TRAIL_LENGTH) {
    ballTrail.pop();
  }

  // Update ball position
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  // Update ball rotation
  ball.rotation += ball.rotationSpeed;

  // Wall collision (left/right)
  if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
    ball.dx *= -1;
  }

  // Wall collision (top)
  if (ball.y - ball.radius < 0) {
    ball.dy *= -1;
  }

  // Floor collision (game over)
  if (ball.y + ball.radius > canvas.height) {
    currentState = GAME_STATE.GAME_OVER;
    if (score > highScore) {
      highScore = score;
      
      // Update user high score
      if (registeredUsers[username]) {
        registeredUsers[username].highScore = highScore;
        saveUserData();
      }
    }
  }

  // Paddle collision
  if (
    ball.y + ball.radius > paddle.y &&
    ball.y + ball.radius < paddle.y + paddle.height &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    ball.dy *= -1;
    
    // Increase score
    score++;
    
    // Adjust ball direction based on where it hit the paddle
    const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    ball.dx = hitPosition * 5; // Max speed of 5 in either direction
    
    // Gradually increase speed
    const speedIncrease = 0.2;
    if (Math.abs(ball.dx) < 10) { // Cap max speed
      ball.dx += ball.dx > 0 ? speedIncrease : -speedIncrease;
    }
    if (Math.abs(ball.dy) < 10) {
      ball.dy -= speedIncrease; // Always going up after paddle hit
    }
  }
}

// Render functions
function renderBackground() {
  // Get current theme colors
  const theme = themes[currentTheme];
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, theme.background);
  gradient.addColorStop(1, theme.backgroundAlt);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw background pattern/stars
  for (let i = 0; i < backgroundPattern.length; i++) {
    const star = backgroundPattern[i];
    
    // Make stars pulse
    star.opacity += star.pulse;
    if (star.opacity > 0.8 || star.opacity < 0.3) {
      star.pulse *= -1;
    }
    
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();
  }
}

function renderLoginScreen() {
  renderBackground();
  
  // Game title with fancy font
  ctx.fillStyle = COLORS.primary;
  ctx.font = fontsLoaded ? '60px Audiowide' : '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PONG GAME', canvas.width / 2, canvas.height / 2 - 160);
  
  // Username input box with glow effect
  ctx.shadowColor = COLORS.primary;
  ctx.shadowBlur = 15;
  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 80, 300, 50);
  ctx.shadowBlur = 0;
  
  // Username text with cursor
  ctx.fillStyle = COLORS.light;
  ctx.font = fontsLoaded ? '24px Orbitron' : '24px Arial';
  ctx.textAlign = 'left';
  const displayText = 'Username: ' + username;
  ctx.fillText(displayText, canvas.width / 2 - 140, canvas.height / 2 - 50);
  
  // Blinking cursor
  if (cursorBlink) {
    const textWidth = ctx.measureText(displayText).width;
    ctx.fillRect(canvas.width / 2 - 140 + textWidth + 2, canvas.height / 2 - 70, 2, 24);
  }
  
  // Login button with hover effect
  ctx.fillStyle = COLORS.secondary;
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 10, 200, 50);
  
  // Button text
  ctx.fillStyle = COLORS.dark;
  ctx.font = fontsLoaded ? '24px Orbitron' : '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('LOGIN', canvas.width / 2, canvas.height / 2 + 22);
  
  // Register button
  ctx.fillStyle = COLORS.primary;
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 60, 200, 50);
  
  // Register button text
  ctx.fillStyle = COLORS.dark;
  ctx.font = fontsLoaded ? '24px Orbitron' : '24px Arial';
  ctx.fillText('REGISTER', canvas.width / 2, canvas.height / 2 + 92);
  
  // Instructions
  ctx.fillStyle = COLORS.light;
  ctx.font = fontsLoaded ? '16px Orbitron' : '16px Arial';
  ctx.fillText('Type your username and click Login or Register', canvas.width / 2, canvas.height / 2 + 140);
  
  // Display login message if any
  if (loginMessageTimer > 0) {
    // Draw message background
    ctx.fillStyle = loginMessage.includes('successful') ? 'rgba(46, 204, 113, 0.8)' : 'rgba(231, 76, 60, 0.8)';
    const messageWidth = ctx.measureText(loginMessage).width + 40;
    ctx.fillRect(canvas.width / 2 - messageWidth / 2, canvas.height / 2 + 160, messageWidth, 40);
    
    // Draw message text
    ctx.fillStyle = COLORS.light;
    ctx.font = fontsLoaded ? '18px Orbitron' : '18px Arial';
    ctx.fillText(loginMessage, canvas.width / 2, canvas.height / 2 + 185);
  }
}

function renderStartScreen() {
  renderBackground();
  
  // Welcome message
  ctx.fillStyle = COLORS.light;
  ctx.font = fontsLoaded ? '40px Audiowide' : '40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Hello, ' + username + '!', canvas.width / 2, canvas.height / 2 - 80);
  
  // Game instructions
  ctx.font = fontsLoaded ? '20px Orbitron' : '20px Arial';
  ctx.fillText('Use arrow keys or A/D to move the paddle', canvas.width / 2, canvas.height / 2 - 20);
  
  // Difficulty info
  ctx.fillStyle = COLORS.warning;
  ctx.fillText('Difficulty increases every 30 seconds', canvas.width / 2, canvas.height / 2 + 10);
  
  // Start button with glow effect
  ctx.shadowColor = COLORS.secondary;
  ctx.shadowBlur = 15;
  ctx.fillStyle = COLORS.secondary;
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 30, 200, 50);
  ctx.shadowBlur = 0;
  
  // Button text
  ctx.fillStyle = COLORS.dark;
  ctx.font = fontsLoaded ? '24px Orbitron' : '24px Arial';
  ctx.fillText('START GAME', canvas.width / 2, canvas.height / 2 + 62);
  
  // Logout instructions
  ctx.fillStyle = COLORS.light;
  ctx.font = fontsLoaded ? '16px Orbitron' : '16px Arial';
  ctx.fillText('Press ESC to logout', canvas.width / 2, canvas.height / 2 + 140);
  
  // Display high score
  if (highScore > 0) {
    ctx.fillStyle = COLORS.primary;
    ctx.font = fontsLoaded ? '24px Orbitron' : '24px Arial';
    ctx.fillText('Your High Score: ' + highScore, canvas.width / 2, canvas.height / 2 - 150);
  }
}

function renderBall() {
  // Render trail first (if applicable)
  if (ball.design === 'trail') {
    for (let i = ballTrail.length - 1; i >= 0; i--) {
      const trailOpacity = 1 - (i / MAX_TRAIL_LENGTH);
      ctx.fillStyle = `rgba(255, 255, 255, ${trailOpacity * 0.3})`;
      ctx.beginPath();
      ctx.arc(ballTrail[i].x, ballTrail[i].y, ballTrail[i].radius * (1 - i/MAX_TRAIL_LENGTH * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Draw the main ball
  switch (ball.design) {
    case 'basic':
      // Simple circle ball
      ctx.fillStyle = COLORS.light;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'cosmic':
      // Cosmic ball with gradient and glow
      ctx.shadowColor = COLORS.accent;
      ctx.shadowBlur = 15;
      
      const gradient = ctx.createRadialGradient(
        ball.x, ball.y, 0,
        ball.x, ball.y, ball.radius * 1.5
      );
      gradient.addColorStop(0, COLORS.accent);
      gradient.addColorStop(0.7, COLORS.primary);
      gradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner glow
      ctx.fillStyle = COLORS.light;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      break;
      
    case 'trail':
      // Ball with motion blur/trail
      ctx.fillStyle = COLORS.light;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

function renderDifficultyPopup() {
  if (showDifficultyPopup) {
    // Create popup background with glow
    ctx.shadowColor = COLORS.warning;
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(52, 73, 94, 0.9)';
    
    const popupWidth = 400;
    const popupHeight = 180;
    const popupX = canvas.width / 2 - popupWidth / 2;
    const popupY = canvas.height / 2 - popupHeight / 2;
    
    // Draw popup background with rounded corners
    ctx.beginPath();
    ctx.roundRect(popupX, popupY, popupWidth, popupHeight, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw popup border
    ctx.strokeStyle = COLORS.warning;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Popup header
    ctx.fillStyle = COLORS.warning;
    ctx.font = fontsLoaded ? '32px Audiowide' : '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DIFFICULTY INCREASED!', canvas.width / 2, popupY + 50);
    
    // Popup content
    ctx.fillStyle = COLORS.light;
    ctx.font = fontsLoaded ? '20px Orbitron' : '20px Arial';
    ctx.fillText(`Level ${currentDifficulty}`, canvas.width / 2, popupY + 90);
    ctx.fillText(`Current Score: ${score}`, canvas.width / 2, popupY + 120);
  }
}

function renderGameplay() {
  // Render background
  renderBackground();
  
  // Draw paddle with gradient
  ctx.shadowColor = COLORS.primary;
  ctx.shadowBlur = 10;
  
  const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
  paddleGradient.addColorStop(0, COLORS.secondary);
  paddleGradient.addColorStop(1, COLORS.primary);
  
  ctx.fillStyle = paddleGradient;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.shadowBlur = 0;
  
  // Add shadow to paddle
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(paddle.x, paddle.y + paddle.height, paddle.width, 3);
  
  // Draw ball
  renderBall();
  
  // Draw score
  ctx.fillStyle = COLORS.light;
  ctx.font = fontsLoaded ? '24px Orbitron' : '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 20, 30);
  
  // Draw difficulty level
  ctx.textAlign = 'center';
  ctx.fillText('Level: ' + currentDifficulty, canvas.width / 2, 30);
  
  // Draw username
  ctx.textAlign = 'right';
  ctx.fillText(username, canvas.width - 20, 30);
  
  // Draw field lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Render difficulty popup if active
  renderDifficultyPopup();
}

function renderGameOver() {
  // First render the gameplay screen
  renderGameplay();
  
  // Game over overlay
  ctx.fillStyle = COLORS.transparentDark;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Game over text
  ctx.fillStyle = COLORS.warning;
  ctx.font = fontsLoaded ? '60px Audiowide' : '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);
  
  // Score
  ctx.fillStyle = COLORS.light;
  ctx.font = fontsLoaded ? '30px Orbitron' : '30px Arial';
  ctx.fillText('Your Score: ' + score, canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillText('High Score: ' + highScore, canvas.width / 2, canvas.height / 2 + 20);
  
  // Play again button with glow
  ctx.shadowColor = COLORS.secondary;
  ctx.shadowBlur = 15;
  ctx.fillStyle = COLORS.secondary;
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 50, 200, 50);
  ctx.shadowBlur = 0;
  
  // Button text
  ctx.fillStyle = COLORS.dark;
  ctx.font = fontsLoaded ? '24px Orbitron' : '24px Arial';
  ctx.fillText('PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 82);
  
  // Instructions
  ctx.fillStyle = COLORS.light;
  ctx.font = fontsLoaded ? '18px Orbitron' : '18px Arial';
  ctx.fillText('Press R to restart or click the button', canvas.width / 2, canvas.height / 2 + 130);
  ctx.fillText('Press ESC to logout', canvas.width / 2, canvas.height / 2 + 160);
}

// Main update function
function update(currentTime) {
  // Calculate delta time
  const deltaTime = currentTime - lastFrameTime || 0;
  lastFrameTime = currentTime;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update game based on current state
  switch (currentState) {
    case GAME_STATE.LOGIN:
      updateCursorBlink(deltaTime);
      updateLoginMessage(deltaTime);
      renderLoginScreen();
      break;
      
    case GAME_STATE.START:
      renderStartScreen();
      break;
      
    case GAME_STATE.PLAYING:
      updatePaddle();
      updateBall();
      updateDifficulty(deltaTime);
      renderGameplay();
      break;
      
    case GAME_STATE.GAME_OVER:
      renderGameOver();
      break;
  }
  
  // Request next frame
  requestAnimationFrame(update);
}

// Start the game loop
requestAnimationFrame(update);