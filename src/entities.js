// Entity base class
export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.active = true;
    }

    update(deltaTime) { }
    draw(ctx) { }

    collidesWith(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }
}

// Player spaceship
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.speed = 300; // pixels per second
        this.health = 3;
        this.shootCooldown = 0;
        this.shootDelay = 0.25; // seconds between shots
    }

    update(deltaTime, keys, canvasWidth) {
        // Movement
        if (keys['ArrowLeft'] && this.x > 0) {
            this.x -= this.speed * deltaTime;
        }
        if (keys['ArrowRight'] && this.x < canvasWidth - this.width) {
            this.x += this.speed * deltaTime;
        }

        // Cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
    }

    canShoot() {
        return this.shootCooldown <= 0;
    }

    shoot() {
        this.shootCooldown = this.shootDelay;
    }

    draw(ctx) {
        // Draw cyan spaceship (triangular shape)
        ctx.fillStyle = '#00FFFF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;

        // Main body (triangle)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y); // Top point
        ctx.lineTo(this.x, this.y + this.height); // Bottom left
        ctx.lineTo(this.x + this.width, this.y + this.height); // Bottom right
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + this.width / 2 - 4, this.y + 8, 8, 8);

        // Wings
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(this.x - 4, this.y + this.height - 8, 8, 8);
        ctx.fillRect(this.x + this.width - 4, this.y + this.height - 8, 8, 8);
    }
}

// Enemy spaceship
export class Enemy extends Entity {
    constructor(x, y, type = 0) {
        super(x, y, 24, 24);
        this.type = type; // 0: red, 1: magenta, 2: yellow
        this.speed = 50 + type * 20; // Different speeds
        this.shootCooldown = Math.random() * 3 + 2; // Random initial cooldown
        this.shootDelay = 3; // seconds between shots
        this.health = 1;
        this.points = 10 + type * 5;
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;

        // Shooting cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        } else {
            this.shootCooldown = this.shootDelay + Math.random() * 2;
        }
    }

    canShoot() {
        return this.shootCooldown <= 0;
    }

    draw(ctx) {
        const colors = ['#FF0000', '#FF00FF', '#FFFF00'];
        ctx.fillStyle = colors[this.type];
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;

        // Enemy body (inverted triangle)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height); // Bottom point
        ctx.lineTo(this.x, this.y); // Top left
        ctx.lineTo(this.x + this.width, this.y); // Top right
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 6, this.y + 6, 4, 4);
        ctx.fillRect(this.x + this.width - 10, this.y + 6, 4, 4);
    }
}

// Bullet
export class Bullet extends Entity {
    constructor(x, y, isPlayerBullet = true) {
        super(x, y, 4, isPlayerBullet ? 12 : 8);
        this.isPlayerBullet = isPlayerBullet;
        this.speed = isPlayerBullet ? -400 : 200; // Negative = up, positive = down
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;
    }

    draw(ctx) {
        ctx.fillStyle = this.isPlayerBullet ? '#00FFFF' : '#FF0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.isPlayerBullet ? '#00FFFF' : '#FF0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// Explosion particle
export class Explosion extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.particles = [];
        this.lifetime = 0.5; // seconds
        this.age = 0;

        // Create particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                color: i % 2 === 0 ? '#FFFF00' : '#FF00FF',
            });
        }
    }

    update(deltaTime) {
        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.active = false;
        }

        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
        });
    }

    draw(ctx) {
        const alpha = 1 - this.age / this.lifetime;
        ctx.globalAlpha = alpha;

        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(
                this.x + this.width / 2 + p.x - 2,
                this.y + this.height / 2 + p.y - 2,
                4,
                4
            );
        });

        ctx.globalAlpha = 1;
    }
}

// Star for background
export class Star {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.size = Math.random() * 2 + 1;
        this.brightness = Math.random() * 0.5 + 0.5;
    }

    update(deltaTime, canvasHeight) {
        this.y += this.speed * deltaTime;
        if (this.y > canvasHeight) {
            this.y = 0;
            this.x = Math.random() * window.innerWidth;
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}
