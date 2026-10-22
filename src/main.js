import './style.css'
import { Game } from './game.js'
import { AuthUI } from './auth-ui.js'
import { saveHighScore, getHighScores } from './supabase.js'

// Game instance
let game = null;
let authUI = null;

// Initialize the game
async function initGame() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-start p-4 md:p-8">
      <!-- Game Header / HUD -->
      <div class="w-full max-w-4xl bg-space-black border-4 border-cyber-cyan p-4 mb-4 flex justify-between items-center relative z-20">
        <!-- Score Counter -->
        <div class="flex items-center gap-2">
          <span class="text-cyber-cyan text-xs md:text-sm pixel-text retro-glow">SCORE:</span>
          <span id="score-display" class="text-cyber-cyan text-xs md:text-sm pixel-text retro-glow">00000</span>
        </div>
        
        <!-- High Score -->
        <div class="flex items-center gap-2">
          <span class="text-neon-magenta text-xs pixel-text">HI:</span>
          <span id="high-score-display" class="text-neon-magenta text-xs pixel-text">00000</span>
        </div>
        
        <!-- Lives Display -->
        <div class="flex items-center gap-2">
          <div id="lives-display" class="flex gap-2">
            ${generateHearts(3)}
          </div>
        </div>
      </div>

      <!-- Game Area -->
      <div class="w-full max-w-4xl border-4 border-neon-magenta relative overflow-hidden bg-black" style="aspect-ratio: 4/3;">
        <canvas id="game-canvas" class="w-full h-full relative z-10"></canvas>
      </div>

      <!-- Footer Info -->
      <div class="mt-4 text-center w-full max-w-4xl flex justify-between items-start">
        <div class="text-left">
          <p class="text-cyber-cyan text-xs pixel-text opacity-70 mb-2">GALACTIC LEADERBOARD:</p>
          <ul id="leaderboard-list" class="text-[10px] text-white pixel-text space-y-1 h-24 overflow-y-auto">
            <li>LOADING...</li>
          </ul>
        </div>
        <p class="text-cyber-cyan text-xs pixel-text opacity-50 mt-4">© 2025 SPACE ARCADE</p>
      </div>
    </div>
  `;

  // Get canvas and initialize game
  const canvas = document.getElementById('game-canvas');
  const scoreDisplay = document.getElementById('score-display');
  const highScoreDisplay = document.getElementById('high-score-display');
  const livesDisplay = document.getElementById('lives-display');
  const leaderboardList = document.getElementById('leaderboard-list');

  // Initialize Auth UI
  authUI = new AuthUI('app');

  // Update Leaderboard Helper
  const updateLeaderboard = async () => {
    const { data, error } = await getHighScores(5);
    if (!error && data) {
      leaderboardList.innerHTML = data.map((entry, i) => `
        <li class="flex gap-4">
          <span class="text-neon-magenta">#${i + 1}</span>
          <span class="text-white">${entry.username || 'ANONYMOUS'}</span>
          <span class="text-cyber-cyan ml-auto">${String(entry.score).padStart(5, '0')}</span>
        </li>
      `).join('');

      // Update local high score if needed
      if (data.length > 0) {
        const globalHigh = data[0].score;
        const localHigh = parseInt(localStorage.getItem('spaceArcadeHighScore') || '0');
        if (globalHigh > localHigh) {
          highScoreDisplay.textContent = String(globalHigh).padStart(5, '0');
        }
      }
    } else {
      leaderboardList.innerHTML = '<li class="text-red-500">OFFLINE</li>';
    }
  };

  // Initial fetch
  updateLeaderboard();

  // Callback functions
  const updateScore = (score) => {
    scoreDisplay.textContent = String(score).padStart(5, '0');
  };

  const updateLives = (lives) => {
    livesDisplay.innerHTML = generateHearts(Math.max(0, lives));
  };

  const onGameOver = async (score, highScore) => {
    highScoreDisplay.textContent = String(highScore).padStart(5, '0');

    // Attempt to save score to cloud
    const user = authUI.getUser();
    if (user) {
      const { error } = await saveHighScore(score);
      if (!error) {
        console.log('Score saved to cloud');
        updateLeaderboard();
      } else {
        console.error('Failed to save score:', error);
      }
    } else {
      console.log('User not logged in, score processing local only');
    }
  };

  // Create and start game
  game = new Game(canvas, updateScore, updateLives, onGameOver);

  // Display initial high score from local storage
  highScoreDisplay.textContent = String(game.highScore).padStart(5, '0');

  // Start game loop
  game.run();
}

// Generate heart icons for lives
function generateHearts(count) {
  return Array(count)
    .fill(0)
    .map(() => '<span class="heart-icon">♥</span>')
    .join('');
}

// Initialize the game when DOM is ready
initGame();
