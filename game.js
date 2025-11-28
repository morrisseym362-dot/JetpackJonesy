// --- Game Configuration ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 }, // Gravity for Flappy Bird style
            debug: false
        }
    },
    scene: [GameScene, GameOverScene]
};

// --- Global Variables ---
let player;
let chaser;
let obstacles;
let score = 0;
let scoreText;
const OBSTACLE_SPEED = -200; // Speed obstacles move left
const JUMP_VELOCITY = -400;  // Upward force when clicking

// Initialize the game
const game = new Phaser.Game(config);

// --- Game Scene (The main gameplay) ---
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    // 1. Preload: Load assets before the game starts
    preload() {
        // Assume images are in an 'assets' folder
        this.load.image('jonesy', 'assets/Mr Jones.png');
        this.load.image('chaser', 'assets/Mr Jones evil twin.png');
        // Simple placeholder obstacle
        this.load.image('obstacle', 'assets/obstacle_block.png'); // You need to create a simple obstacle image
    }

    // 2. Create: Set up the game world
    create() {
        this.cameras.main.setBackgroundColor('#87CEEB'); // Sky Blue

        // Player (Jetpack Jonesy)
        player = this.physics.add.sprite(100, 300, 'jonesy');
        player.setScale(0.5); // Adjust size as needed
        player.setCollideWorldBounds(true); // Don't let Jonesy fall off the screen
        player.body.setSize(player.width * 0.5, player.height * 0.5); // Adjust hitbox

        // Chaser (Placed off-screen to start)
        chaser = this.physics.add.sprite(-100, 300, 'chaser');
        chaser.setScale(0.5);
        // FUTURE STEP: Implement chaser following logic here

        // Obstacles Group
        obstacles = this.physics.add.group();

        // Input handler for Flappy Bird jump (Space or Click)
        this.input.keyboard.on('keydown-SPACE', this.jump, this);
        this.input.on('pointerdown', this.jump, this);

        // Collision Handler: Player hits Obstacle
        this.physics.add.collider(player, obstacles, this.hitObstacle, null, this);
        
        // Timer to create new obstacles
        this.time.addEvent({
            delay: 1500, // Create a new set of obstacles every 1.5 seconds
            callback: this.addObstaclePair,
            callbackScope: this,
            loop: true
        });

        // Score Text
        score = 0;
        scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
    }

    // 3. Update: Game loop, runs every frame
    update() {
        // Continuous horizontal movement (Jetpack Joyride style)
        player.body.velocity.x = 200; 

        // Check if player has passed an obstacle and update score
        obstacles.children.entries.forEach(obstacle => {
            if (obstacle.x < player.x && !obstacle.passed) {
                obstacle.passed = true;
                score += 0.5; // Count 0.5 for each part of the gap
                scoreText.setText('Score: ' + Math.floor(score));
            }

            // Clean up obstacles that are off-screen
            if (obstacle.x < -50) {
                obstacle.destroy();
            }
        });

        // Keep the player centered horizontally (Simulating infinite runner)
        this.cameras.main.scrollX = player.x - 100;
        scoreText.x = this.cameras.main.scrollX + 16;
        
        // FUTURE STEP: Implement complex chaser logic here
    }

    // Custom method for the jump
    jump() {
        player.body.velocity.y = JUMP_VELOCITY;
    }

    // Custom method to add top and bottom obstacle pair (Flappy Bird gap)
    addObstaclePair() {
        const gapHeight = 200; // Size of the safe passage
        const obstacleWidth = 50;
        const xPos = player.x + 800; // Start far right, relative to the player
        
        // Randomly determine the center of the gap
        const center = Phaser.Math.Between(150 + gapHeight / 2, 600 - 150 - gapHeight / 2);

        // Top Obstacle
        const topObstacle = obstacles.create(xPos, center - gapHeight / 2, 'obstacle');
        topObstacle.displayWidth = obstacleWidth;
        topObstacle.displayHeight = center - gapHeight / 2;
        topObstacle.body.immovable = true;
        topObstacle.setOrigin(0.5, 1); // Anchor to the bottom

        // Bottom Obstacle
        const bottomObstacle = obstacles.create(xPos, center + gapHeight / 2, 'obstacle');
        bottomObstacle.displayWidth = obstacleWidth;
        bottomObstacle.displayHeight = 600 - (center + gapHeight / 2);
        bottomObstacle.body.immovable = true;
        bottomObstacle.setOrigin(0.5, 0); // Anchor to the top

        // Set the continuous velocity to move left
        obstacles.children.entries.forEach(obstacle => {
            obstacle.body.velocity.x = OBSTACLE_SPEED;
            obstacle.passed = false; // Custom flag to check if player has passed it
        });
    }

    // Custom method for Game Over
    hitObstacle() {
        this.scene.start('GameOverScene', { finalScore: Math.floor(score) });
    }
}


// --- Game Over Scene ---
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.finalScore;
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.8)'); // Dark overlay

        const { width, height } = this.sys.game.canvas;

        this.add.text(width / 2, height / 2 - 150, 'YOU GOT CAUGHT!', { fontSize: '48px', fill: '#FF0000' }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 - 90, `Final Score: ${this.finalScore}`, { fontSize: '36px', fill: '#FFF' }).setOrigin(0.5);

        // Display the Chaser image
        const chaserImage = this.add.image(width / 2, height / 2, 'chaser');
        chaserImage.setScale(0.8);
        chaserImage.setTint(0xcc0000); // Make it look a bit menacing

        // Retry Button
        const retryButton = this.add.text(width / 2, height / 2 + 150, 'RETRY', {
            fontSize: '40px',
            fill: '#0F0',
            backgroundColor: '#333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        retryButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Back to Menu Button (Assuming you'll add a main menu later)
        const menuButton = this.add.text(width / 2, height / 2 + 230, 'BACK TO MENU', {
            fontSize: '28px',
            fill: '#FFF',
            backgroundColor: '#333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        menuButton.on('pointerdown', () => {
             // For now, it just retries, but you can change this to a 'MenuScene' later.
             this.scene.start('GameScene'); 
        });
    }
}