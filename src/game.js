import { Player, Enemy, Bullet, Explosion, Star } from './entities.js';
import AudioSystem from './audio.js';

export class Game {
    constructor(canvas, onScoreUpdate, onLivesUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScoreUpdate = onScoreUpdate;
        this.onLivesUpdate = onLivesUpdate;
        this.onGameOver = onGameOver;

        // Game state
        this.state = 'menu'; // menu, playing, paused, gameover
        this.score = 0;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('spaceArcadeHighScore') || '0');

        // Entities
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];
        this.stars = [];

        // Timing
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnDelay = 2; // seconds

        // Input
        this.keys = {};

        // Audio
        this.audio = new AudioSystem();

        // Initialize
        this.setupCanvas();
        this.createStarfield();
        this.setupInput();
    }

    setupCanvas() {
        const resizeCanvas = () => {
            const maxWidth = 800;
            const maxHeight = 600;
            const aspectRatio = 4 / 3;

            let width = Math.min(window.innerWidth - 40, maxWidth);
            let height = width / aspectRatio;

            if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
            }

            this.canvas.width = width;
            this.canvas.height = height;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    createStarfield() {
        for (let i = 0; i < 100; i++) {
            this.stars.push(
                new Star(
                    Math.random() * this.canvas.width,
                    Math.random() * this.canvas.height,
                    Math.random() * 50 + 25
                )
            );
        }
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            if (e.key === ' ' && this.state === 'menu') {
                e.preventDefault();
                this.startGame();
            } else if (e.key === 'Enter' && this.state === 'gameover') {
                e.preventDefault();
                this.startGame();
            } else if (e.key === 'p' && this.state === 'playing') {
                e.preventDefault();
                this.pause();
            } else if (e.key === 'p' && this.state === 'paused') {
                e.preventDefault();
                this.resume();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    startGame() {
        this.audio.init();
        this.state = 'playing';
        this.score = 0;
        this.level = 1;
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];

        this.player = new Player(this.canvas.width / 2 - 16, this.canvas.height - 60);
        this.onScoreUpdate(this.score);
        this.onLivesUpdate(this.player.health);
    }

    pause() {
        this.state = 'paused';
    }

    resume() {
        this.state = 'playing';
    }

    spawnEnemy() {
        const type = Math.floor(Math.random() * 3);
        const x = Math.random() * (this.canvas.width - 24);
        this.enemies.push(new Enemy(x, -24, type));
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;

        // Update starfield
        this.stars.forEach(star => star.update(deltaTime, this.canvas.height));

        // Update player
        if (this.player) {
            this.player.update(deltaTime, this.keys, this.canvas.width);

            // Player shooting
            if (this.keys[' '] && this.player.canShoot()) {
                this.bullets.push(
                    new Bullet(this.player.x + this.player.width / 2 - 2, this.player.y, true)
                );
                this.player.shoot();
                this.audio.playShoot();
            }
        }

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);

            // Enemy shooting
            if (enemy.canShoot() && Math.random() < 0.3) {
                this.bullets.push(
                    new Bullet(enemy.x + enemy.width / 2 - 2, enemy.y + enemy.height, false)
                );
            }

            // Remove enemies that went off screen
            if (enemy.y > this.canvas.height) {
                enemy.active = false;
            }
        });

        // Update bullets
        this.bullets.forEach(bullet => {
            bullet.update(deltaTime);

            // Remove bullets off screen
            if (bullet.y < -bullet.height || bullet.y > this.canvas.height) {
                bullet.active = false;
            }
        });

        // Update explosions
        this.explosions.forEach(explosion => explosion.update(deltaTime));

        // Collision detection
        this.checkCollisions();

        // Spawn enemies
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer >= this.enemySpawnDelay) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }

        // Remove inactive entities
        this.enemies = this.enemies.filter(e => e.active);
        this.bullets = this.bullets.filter(b => b.active);
        this.explosions = this.explosions.filter(e => e.active);

        // Level progression
        if (this.score > 0 && this.score % 100 === 0 && this.score !== this.lastLevelScore) {
            this.level++;
            this.lastLevelScore = this.score;
            this.enemySpawnDelay = Math.max(0.5, this.enemySpawnDelay - 0.1);
            this.audio.playLevelUp();
        }
    }

    checkCollisions() {
        // Player bullets vs enemies
        this.bullets.forEach(bullet => {
            if (!bullet.isPlayerBullet) return;

            this.enemies.forEach(enemy => {
                if (bullet.collidesWith(enemy)) {
                    bullet.active = false;
                    enemy.active = false;
                    this.score += enemy.points;
                    this.onScoreUpdate(this.score);
                    this.explosions.push(new Explosion(enemy.x, enemy.y));
                    this.audio.playExplosion();

                    // Update high score
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('spaceArcadeHighScore', this.highScore.toString());
                    }
                }
            });
        });

        // Enemy bullets vs player
        this.bullets.forEach(bullet => {
            if (bullet.isPlayerBullet || !this.player) return;

            if (bullet.collidesWith(this.player)) {
                bullet.active = false;
                this.player.health--;
                this.onLivesUpdate(this.player.health);
                this.audio.playHit();

                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        });

        // Enemies vs player
        if (this.player) {
            this.enemies.forEach(enemy => {
                if (enemy.collidesWith(this.player)) {
                    enemy.active = false;
                    this.player.health--;
                    this.onLivesUpdate(this.player.health);
                    this.explosions.push(new Explosion(enemy.x, enemy.y));
                    this.audio.playHit();

                    if (this.player.health <= 0) {
                        this.gameOver();
                    }
                }
            });
        }
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.playGameOver();
        this.onGameOver(this.score, this.highScore);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw starfield
        this.stars.forEach(star => star.draw(this.ctx));

        // Draw entities
        if (this.state === 'playing' || this.state === 'paused') {
            this.bullets.forEach(bullet => bullet.draw(this.ctx));
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            if (this.player) this.player.draw(this.ctx);
            this.explosions.forEach(explosion => explosion.draw(this.ctx));
        }

        // Draw UI overlays
        if (this.state === 'menu') {
            this.drawMenu();
        } else if (this.state === 'paused') {
            this.drawPaused();
        } else if (this.state === 'gameover') {
            this.drawGameOver();
        }
    }

    drawMenu() {
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SPACE ARCADE', this.canvas.width / 2, this.canvas.height / 2 - 40);

        this.ctx.fillStyle = '#FF00FF';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2 + 20);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.fillText('← → Move  SPACE Fire  P Pause', this.canvas.width / 2, this.canvas.height / 2 + 60);

        if (this.highScore > 0) {
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 90);
        }
    }

    drawPaused() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillText('Press P to Resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '24px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);

        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = '14px "Press Start 2P"';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);

        if (this.score === this.highScore && this.score > 0) {
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillText('NEW HIGH SCORE!', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillText('Press ENTER to Restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }

    run() {
        const gameLoop = (currentTime) => {
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            this.update(deltaTime);
            this.draw();

            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }
}
