// Game setup
const gameArea = document.getElementById("gameArea");
const playerBike = document.getElementById("playerBike");
const scoreBoard = document.getElementById("scoreBoard");
const levelBoard = document.getElementById("levelBoard");
const gameOverModal = document.getElementById("gameOverModal");
const thankYouModal = document.getElementById("thankYouModal");
const gameRulesModal = document.getElementById("gameRulesModal");
const startGameBtn = document.getElementById("startGameBtn"); // Start game button
const muteMusicBtn = document.getElementById("muteMusicBtn");
const unmuteMusicBtn = document.getElementById("unmuteMusicBtn");

let score = 0;
let highScore = localStorage.getItem("highScore") || 0; // Retrieve high score or default to 0
let gameSpeed = 5; // Initial speed for obstacles
let isGameOver = false;
let isPaused = false; // Track the pause state
let animationFrameId = null; // Track the requestAnimationFrame ID
let obstacles = [];
let gardens = []; // Store garden objects
let speedIncreaseThreshold = 100; // Points at which speed increases
let currentLevel = 1; // Initial level
let obstacleInterval;
let bobbingIntervalId = null; // Track the interval ID for the bobbing effect

// Background music
const backgroundMusic = new Audio("Sounds/background-music.wav");
backgroundMusic.loop = true; // Loop the music continuously
backgroundMusic.volume = 0.5; // Set the volume (0.0 to 1.0)

// Collision sound
const collisionSound = new Audio("Sounds/collision-sound.wav");
collisionSound.volume = 1.0; // Set the volume (0.0 to 1.0)

// Ensure modals are hidden initially
gameOverModal.style.display = "none";
thankYouModal.style.display = "none";
gameRulesModal.style.display = "flex"; // Show game rules modal initially

// Lane positions (x-coordinates for each lane center)
const gameAreaWidth = 400; // Width of the game area
const elementWidth = 50; // Width of playerBike and obstacles
const laneWidth = gameAreaWidth / 3; // Width of each lane

const lanes = [
    (laneWidth / 2) - (elementWidth / 2), // Left lane center
    (laneWidth * 1.5) - (elementWidth / 2), // Center lane center
    (laneWidth * 2.5) - (elementWidth / 2), // Right lane center
];

// Add High Score Display
const highScoreBoard = document.createElement("div");
highScoreBoard.id = "highScoreBoard";
highScoreBoard.textContent = `High Score: ${highScore}`;
highScoreBoard.style.position = "absolute";
highScoreBoard.style.top = "10px";
highScoreBoard.style.left = "50px";
highScoreBoard.style.color = "yellow";
highScoreBoard.style.fontSize = "20px";
highScoreBoard.style.fontWeight = "bold";
highScoreBoard.style.textShadow = "2px 2px 5px rgba(0, 0, 0, 0.8)";
highScoreBoard.style.zIndex = "10";
document.body.appendChild(highScoreBoard);

// Function to play background music
function playBackgroundMusic() {
    backgroundMusic.play().catch((error) => {
        console.error("Error playing background music:", error);
    });
}

// Function to pause background music
function pauseBackgroundMusic() {
    backgroundMusic.pause();
}

// Function to play collision sound
function playCollisionSound() {
    collisionSound.currentTime = 0; // Reset the sound to the start
    collisionSound.play().catch((error) => {
        console.error("Error playing collision sound:", error);
    });
}

// Game initialization function
function initializeGame() {
    // Reset game state
    score = 0;
    gameSpeed = 5;
    currentLevel = 1;
    isGameOver = false;
    isPaused = false;
    obstacles.forEach((obstacle) => obstacle.remove()); // Clear obstacles
    obstacles = [];
    gardens.forEach((garden) => garden.remove()); // Clear gardens
    gardens = [];

    // Update score and level boards
    scoreBoard.textContent = `Score: ${score}`;
    levelBoard.textContent = `Level: ${currentLevel}`;
    highScoreBoard.textContent = `High Score: ${highScore}`; // Update high score display

    // Initialize game elements
    createDashedLanes();
    createGardens();
    updateDashedLinesSpeed();
    addBobbingEffect();
    updatePlayerLane();
}

// Player starts in the middle lane
let playerLaneIndex = 1; // Start in the center lane

function createGardens() {
    // Left Gardens
    for (let i = 0; i < 2; i++) {
        const leftGarden = document.createElement("div");
        leftGarden.classList.add("garden", "left");
        leftGarden.style.top = `${-100 * i}vh`; // Stack gardens vertically
        document.body.appendChild(leftGarden);
        gardens.push(leftGarden); // Add to the gardens array
    }

    // Right Gardens
    for (let i = 0; i < 2; i++) {
        const rightGarden = document.createElement("div");
        rightGarden.classList.add("garden", "right");
        rightGarden.style.top = `${-100 * i}vh`; // Stack gardens vertically
        document.body.appendChild(rightGarden);
        gardens.push(rightGarden); // Add to the gardens array
    }
}

// Function to dynamically update garden animation speed
function updateGardenSpeed() {
    const gardenElements = document.querySelectorAll(".garden");
    const animationDuration = `${10 / gameSpeed}s`; // Adjust duration inversely to game speed
    gardenElements.forEach((garden) => {
        garden.style.animationDuration = animationDuration;
    });
}

function moveGardens() {
    gardens.forEach((garden) => {
        let currentTop = parseFloat(garden.style.top);

        if (currentTop >= 100) {
            // Reset position to the top when it goes off-screen
            garden.style.top = "-100vh";
        } else {
            // Move the garden down based on game speed
            garden.style.top = `${currentTop + gameSpeed * 0.1}vh`; // Adjust speed multiplier as needed
        }
    });
}


// Create dashed lanes
function createDashedLanes() {
    const dashedLanes = document.querySelectorAll(".lane");
    dashedLanes.forEach((lane) => lane.remove()); // Clear existing lanes
    for (let i = 1; i <= 2; i++) {
        const dashedLane = document.createElement("div");
        dashedLane.classList.add("lane");
        dashedLane.style.left = `${laneWidth * i - 2.5}px`; // Center the dashed line
        dashedLane.style.animationDuration = `${100 / gameSpeed}s`; // Initial dashed line speed
        gameArea.appendChild(dashedLane);
    }
}

function updateDashedLinesSpeed() {
    const dashedLines = document.querySelectorAll(".lane");

    // Set animation duration inversely proportional to gameSpeed
    dashedLines.forEach(line => {
        line.style.animationDuration = `${1 / gameSpeed}s`; // Faster gameSpeed reduces animation duration
    });
}

function addBobbingEffect() {
    // Clear any existing bobbing interval
    if (bobbingIntervalId) {
        clearInterval(bobbingIntervalId);
    }

    let bobbingDirection = 1; // 1 for upward, -1 for downward
    let bobbingAmount = 0; // Current bobbing amount

    bobbingIntervalId = setInterval(() => {
        if (!isGameOver) {
            // Update the bobbing amount
            bobbingAmount += bobbingDirection * 0.5; // Adjust 0.5 for smoother bobbing

            // Reverse direction at limits
            if (bobbingAmount > 5 || bobbingAmount < -5) {
                bobbingDirection *= -1;
            }

            // Apply the transformation
            playerBike.style.transform = `translateY(${bobbingAmount}px)`;
        }
    }, 50); // Adjust 50ms for smoother animation
}


// Update High Score
function updateHighScore() {
    if (score > highScore) {
        highScore = score; // Update high score
        localStorage.setItem("highScore", highScore); // Save to localStorage
        highScoreBoard.textContent = `High Score: ${highScore}`; // Update display
    }
}

// Keypress tracking
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
};

// Mute music
muteMusicBtn.addEventListener("click", () => {
    backgroundMusic.muted = true;
    muteMusicBtn.style.display = "none";
    unmuteMusicBtn.style.display = "inline";
});

// Unmute music
unmuteMusicBtn.addEventListener("click", () => {
    backgroundMusic.muted = false;
    unmuteMusicBtn.style.display = "none";
    muteMusicBtn.style.display = "inline";
});

// Listen for key presses to move the player
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && playerLaneIndex > 0) {
        playerLaneIndex--; // Move left
        updatePlayerLane();
    }
    if (e.key === "ArrowRight" && playerLaneIndex < lanes.length - 1) {
        playerLaneIndex++; // Move right
        updatePlayerLane();
    }
    if (e.key === " " && !isGameOver) {
        togglePause(); // Toggle pause when space bar is pressed
    }
});

// Update player position based on the current lane
function updatePlayerLane() {
    playerBike.style.left = `${lanes[playerLaneIndex]}px`;
}

// Toggle Pause
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseBackgroundMusic();
        cancelAnimationFrame(animationFrameId);
        clearInterval(obstacleInterval);
    } else {
        obstacleInterval = setInterval(() => {
            if (!isGameOver) createObstacle();
        }, 1500);
        playBackgroundMusic();
        gameLoop();
    }
}

// Create an obstacle
function createObstacle() {
    const obstacle = document.createElement("div");
    obstacle.classList.add("obstacle");

    // Assign the obstacle to a random lane
    const laneIndex = Math.floor(Math.random() * lanes.length);
    obstacle.style.left = `${lanes[laneIndex]}px`;
    obstacle.style.top = "0px";

    gameArea.appendChild(obstacle);
    obstacles.push(obstacle);
}

function moveObstacles() {
    obstacles.forEach((obstacle, index) => {
        const obstacleTop = parseInt(obstacle.style.top);

        if (obstacleTop > gameArea.offsetHeight) {
            // Remove obstacle if it goes off-screen
            obstacle.remove();
            obstacles.splice(index, 1);
            score += 10; // Increase score
            scoreBoard.textContent = `Score: ${score}`;
            levelBoard.textContent = `Level: ${currentLevel}`;
            adjustSpeedAndLevel(); // Check if speed or level should increase
            updateHighScore(); // Update high score
        } else {
            obstacle.style.top = `${obstacleTop + gameSpeed}px`;

            // Check for collision
            const obstacleRect = obstacle.getBoundingClientRect();
            const playerRect = playerBike.getBoundingClientRect();

            if (
                obstacleRect.left < playerRect.right &&
                obstacleRect.right > playerRect.left &&
                obstacleRect.top < playerRect.bottom &&
                obstacleRect.bottom > playerRect.top
            ) {
                endGame();
            }
        }
    });
}

// Adjust game speed and level based on score
function adjustSpeedAndLevel() {
    if (score % speedIncreaseThreshold === 0) {
        gameSpeed += 1; // Increase obstacle speed
        currentLevel = Math.floor(score / speedIncreaseThreshold) + 1; // Update level
        updateDashedLinesSpeed(); // Adjust dashed line speed
    }
}

// End the game
function endGame() {
    isGameOver = true;
    pauseBackgroundMusic(); // Stop the background music
    playCollisionSound(); // Play the collision sound

    // Stop all obstacles
    obstacles.forEach((obstacle) => obstacle.remove());
    obstacles = [];

    // Stop interval and animation
    clearInterval(obstacleInterval);
    cancelAnimationFrame(animationFrameId);

    // Show the Game Over modal
    gameOverModal.style.display = "flex";

    // Update the score in the modal
    const finalScoreElement = document.getElementById("finalScore");
    finalScoreElement.textContent = `Final Score: ${score} | Level: ${currentLevel}`;
}

// Restart the game
function restartGame() {
    isGameOver = false;
    score = 0;
    gameSpeed = 5;
    currentLevel = 1; // Reset level
    playerLaneIndex = 1; // Reset player to the middle lane
    updatePlayerLane();
    updateDashedLinesSpeed(); // Reset dashed line speed
    playBackgroundMusic();
    scoreBoard.textContent = `Score: ${score}`;
    levelBoard.textContent = `Level: ${currentLevel}`;
    gameOverModal.style.display = "none";
    initializeGame();
    obstacleInterval = setInterval(() => {
        if (!isGameOver) createObstacle();
    }, 1500);
    addBobbingEffect();
    gameLoop(); // Restart the game loop
}

// Event listeners for modal buttons
document.getElementById("playAgainBtn").addEventListener("click", () => {
    restartGame();
});

document.getElementById("exitBtn").addEventListener("click", () => {
    gameOverModal.style.display = "none"; // Hide game over modal
    gameRulesModal.style.display = "flex"; // Show game rules modal

    // Clear the bobbing interval to stop it
    if (bobbingIntervalId) {
        clearInterval(bobbingIntervalId);
    }
});

// Game loop
function gameLoop() {
    if (isGameOver || isPaused) return;

    moveObstacles();
    moveGardens();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Start the game when the "Start Game" button is clicked
startGameBtn.addEventListener("click", () => {
    gameRulesModal.style.display = "none"; // Hide the modal
    initializeGame(); // Set up the game
    obstacleInterval = setInterval(() => {
        if (!isGameOver) createObstacle();
    }, 1500);
    playBackgroundMusic();
    gameLoop(); // Start the game loop
});
