// ------------------------------------
// 1. Elementos DOM
// ------------------------------------
const grid = document.querySelector('.grid')
const scoreDisplay = document.querySelector('#score')
const mainContainer = document.querySelector('.container')
const startScreen = document.querySelector('#start-screen')
const startButton = document.querySelector('#start-button')
const startMessage = document.querySelector('#start-message')
const highScoresButton = document.querySelector('#high-scores-button')
const audioButton = document.querySelector('#audio-toggle')

// ------------------------
//  2. Audio
// ------------------------
const blockBreakSoundEffect = new Audio('./sounds/block-break.mp3')
const lifeSoundEffect = new Audio('./sounds/mario-1up.mp3')
const deathSoundEffect = new Audio('./sounds/death-sound-effect.mp3')
const gameOverSoundEffect = new Audio('./sounds/mario-game-over.mp3')
let audioAllowed = true

const blockHitPool = []
const poolSize = 5

for (let i = 0; i < poolSize; i++) {
    blockHitPool.push(new Audio('./sounds/block-break.mp3'))
}

let currentIndex = 0

function playBlockHitPool() {
    const audio = blockHitPool[currentIndex]
    if(audioAllowed){
        audio.currentTime = 0
        audio.play()
        currentIndex = (currentIndex + 1) % poolSize
    }
}

// função para tocar o efeito sonoro desde o inicio
function playSingleSound(soundEffect){
    if (audioAllowed) {
        soundEffect.currentTime = 0 // reinicia o som
        soundEffect.play()          // toca o som
    }
}

function toggleAudio() {
    audioAllowed = !audioAllowed
    audioButton.textContent = `Audio: ${audioAllowed ? 'on' : 'off'}`
}

// -----------------------
// 3. Estados do Jogo
// -----------------------
let timeBall = 30
const boardWidth = grid.clientWidth
const boardHeight = grid.clientHeight
let xDirection = -3
let yDirection = 3
const blockWidth = 100
const blockHeight = 20
const gap = 10
const rows = 3
const cols = 7
const ballDiameter = 20
const maxLives = 6
const playerSpeed = 8
let blocksDestroyed = 0
let lives = 3
let blockHitThisFrame = false
let timerId
let score = 0
let gameData = {
    highscores: []
}

const keysPressed = {
    ArrowLeft: false,
    ArrowRight: false
}

function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') {
        keysPressed.ArrowLeft = true
    } else if (e.key === 'ArrowRight') {
        keysPressed.ArrowRight = true
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft') {
        keysPressed.ArrowLeft = false
    } else if (e.key === 'ArrowRight') {
        keysPressed.ArrowRight = false
    }
}

function updatePlayerMovement() {
    if (keysPressed.ArrowLeft && currentPlayerPosition[0] > 0) {
        currentPlayerPosition[0] -= playerSpeed
    }
    if (keysPressed.ArrowRight && currentPlayerPosition[0] < boardWidth - blockWidth) {
        currentPlayerPosition[0] += playerSpeed
    }
    drawUser()
}

// -----------------------------
// 4. Posições Player e Bola
// -----------------------------
const useStart = [boardWidth / 2 - blockWidth / 2, 10]
let currentPlayerPosition = [...useStart]

const ballStart = [boardWidth / 2 - ballDiameter / 2, 40]
let currentBallPosition = [...ballStart]


class Block {
    constructor(xAxis, yAxis, blockColor){
        this.bottomLeft = [xAxis, yAxis]
        this.bottomRight = [xAxis + blockWidth, yAxis]
        this.topRight = [xAxis + blockWidth, yAxis + blockHeight]
        this.topLeft = [xAxis, yAxis + blockHeight]
        this.blockColor = blockColor
    }
}

// -----------------------------
// 5. Gereção de Bolas
// -----------------------------
const blocks = []
function createBlocks(){
    const totalWidth = cols * blockWidth + (cols - 1) * gap
    const offsetX = (boardWidth - totalWidth) / 2
    
    function getColor(row) {
        if (row === 0) return 'yellow'
        if (row === 1) return 'green'
        if (row === 2) return 'red'
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = offsetX + col * (blockWidth + gap)
            const y = boardHeight - (row + 1) * (blockHeight + gap)
            blocks.push(new Block(x, y, getColor(row)))
        }
    }
}
createBlocks()

// draw my blocks
function addBlocks(){
    for(let i = 0; i < blocks.length; i++){
        const block = document.createElement('div')
        block.classList.add('block')
        block.style.left = blocks[i].bottomLeft[0] + 'px'
        block.style.bottom = blocks[i].bottomLeft[1] + 'px'
        block.style.backgroundColor = blocks[i].blockColor
        grid.appendChild(block)
    }
}

addBlocks()

// -----------------------------
//  6. Funções Auxiliares
// -----------------------------
// Função de Formatação de Pontos
function formatScore(){
    scoreDisplay.innerHTML = String(score).padStart(7, '0')
}
formatScore()

function saveHighScore(newScore) {
    let highscores = loadHighScores()
    highscores.push({ score: newScore, date: new Date().toLocaleDateString('pt-BR') })
    highscores.sort((a, b) => b.score - a.score)
    highscores = highscores.slice(0, 10)
    saveGameData({ highscores })
}

function loseLife() {
    lives--                  // diminui 1 vida
    updateLivesDisplay()     // atualiza o display de corações

    if (lives === 0) {       // se não restar vidas
        clearInterval(timerId)
        scoreDisplay.innerHTML = 'Game Over'
        playSingleSound(gameOverSoundEffect)
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keyup', handleKeyUp)
        saveHighScore(score)
        showGameOverScreen()
    } else {
        // pausa antes de renascer
        clearInterval(timerId)        // pausa a bola
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keyup', handleKeyUp)
        playSingleSound(deathSoundEffect)
        
        setTimeout(() => {
            resetBall()               // reposiciona bola
            resetPlayer()             // reposiciona player
            scoreDisplay.innerHTML = String(score).padStart(7, '0')
            document.addEventListener('keydown', handleKeyDown)
            document.addEventListener('keyup', handleKeyUp)
            timerId = setInterval(moveBall, timeBall)  // retoma o jogo
        }, 3000) // pausa de 1 segundo
    }
}

function resetBall() {
    currentBallPosition = [boardWidth / 2 - ballDiameter / 2, 40] // posição inicial da bola
    xDirection = -3
    yDirection = 3
    drawBall()
}

function resetPlayer() {
    currentPlayerPosition = [boardWidth / 2 - blockWidth / 2, 10] // posição inicial do player
    drawUser()
}

function updateLivesDisplay() {
    const livesContainer = document.querySelector('.lives')
    livesContainer.innerHTML = ''

    for (let i = 0; i < lives; i++) {
        const heart = document.createElement('span')
        heart.innerHTML = '&hearts;'
        livesContainer.appendChild(heart)
    }
}
updateLivesDisplay()

function showStartScreen(message, buttonText) {
    startMessage.textContent = message
    startButton.textContent = buttonText
    startScreen.classList.remove('hidden')
}

function hideStartScreen() {
    startScreen.classList.add('hidden')
}

function resetLevel() {
    grid.querySelectorAll('.block').forEach((block) => block.remove())
    blocks.length = 0
    createBlocks()
    addBlocks()
}

function resetGame() {
    score = 0
    lives = 3
    blocksDestroyed = 0
    blockHitThisFrame = false
    currentPlayerPosition = [...useStart]
    currentBallPosition = [...ballStart]
    xDirection = -3
    yDirection = 3
    formatScore()
    updateLivesDisplay()
    drawUser()
    drawBall()
    resetLevel()
}

function startGame() {
    hideStartScreen()
    resetGame()
    keysPressed.ArrowLeft = false
    keysPressed.ArrowRight = false
    timerId = setInterval(moveBall, timeBall)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
}

function showGameOverScreen() {
    showStartScreen('Game Over! Volte ao menu para recomeçar.', 'Voltar ao menu')
}

// --------------------------------
// 7. Armazenamento Local de Pontos
// --------------------------------

// Key used to store/retrieve data in localStorage
const STORAGE_KEY = "breakoutGameData";

/**
 * Save data to localStorage
 * @param {Object} data - The data to save (e.g., { highScores: [...] })
 */
function saveGameData(data) {
  try {
    const jsonData = JSON.stringify(data); // convert to JSON string
    localStorage.setItem(STORAGE_KEY, jsonData);
    console.log("Game data saved!");
  } catch (error) {
    console.error("Failed to save game data:", error);
  }
}

/**
 * Load data from localStorage
 * @returns {Object|null} The loaded data, or null if none exists
 */
function loadGameData() {
  try {
    const jsonData = localStorage.getItem(STORAGE_KEY);
    if (!jsonData) return null; // no saved data
    return JSON.parse(jsonData); // convert back to JS object
  } catch (error) {
    console.error("Failed to load game data:", error);
    return null;
  }
}

function loadHighScores() {
  const data = loadGameData()
  return data && data.highscores ? data.highscores : []
}

function displayHighScoresOverlay() {
    const highscores = loadHighScores()
    let content = '<h2 class="screen-title">Melhores Pontuações</h2><div style="text-align: left; font-size: 12px; max-height: 300px; overflow-y: auto;">'
    
    if (highscores.length === 0) {
        content += '<p>Nenhuma pontuação salva ainda!</p>'
    } else {
        content += '<table style="width: 100%; border-collapse: collapse; font-size: 12px;"><tr style="border-bottom: 1px solid white;"><td style="padding: 4px; text-align: center;">Pos</td><td style="padding: 4px; text-align: right;">Pontos</td><td style="padding: 4px; text-align: right;">Data</td></tr>'
        highscores.forEach((entry, index) => {
            content += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.3);"><td style="padding: 4px; text-align: center;">${index + 1}º</td><td style="padding: 4px; text-align: right;">${entry.score}</td><td style="padding: 4px; text-align: right;">${entry.date}</td></tr>`
        })
        content += '</table>'
    }
    
    content += '</div>'
    startMessage.innerHTML = content
    startButton.textContent = 'Voltar ao Menu'
    startButton.onclick = (e) => {
        e.preventDefault()
        startButton.onclick = null
        showStartScreen('Pronto para jogar Breakout?', 'Iniciar Jogo')
    }
    startScreen.classList.remove('hidden')
}

// ----------------------
//  8. Inicialização do Jogo
// ----------------------

// add user
const user = document.createElement('div')
user.classList.add('user')
grid.appendChild(user)
drawUser()

// add ball
const ball = document.createElement('div')
ball.classList.add('ball')
grid.appendChild(ball)
drawBall()

function drawUser(){
    user.style.left = currentPlayerPosition[0] + 'px'
    user.style.bottom = currentPlayerPosition[1] + 'px'
}

function drawBall(){
    ball.style.left = currentBallPosition[0] + 'px'
    ball.style.bottom = currentBallPosition[1] + 'px'
}

// add ball
function moveUser(e){
    switch(e.key){
        case 'ArrowLeft':
            if (currentPlayerPosition[0] > 0) {
                currentPlayerPosition[0] -= 10
                drawUser()
            }
            break
        case 'ArrowRight':
            if (currentPlayerPosition[0] < (boardWidth - blockWidth)) {
                currentPlayerPosition[0] += 10
                drawUser()
            }
            break
    }
}

// move ball
function moveBall() {
    updatePlayerMovement()
    currentBallPosition[0] += xDirection
    currentBallPosition[1] += yDirection
    checkForCollision()
    drawBall()
}




function getBallBounds() {
    return {
        left: currentBallPosition[0],
        right: currentBallPosition[0] + ballDiameter,
        bottom: currentBallPosition[1],
        top: currentBallPosition[1] + ballDiameter,
        centerX: currentBallPosition[0] + ballDiameter / 2
    }
}

function getBlockBounds(block) {
    return {
        left: block.bottomLeft[0],
        right: block.bottomRight[0],
        bottom: block.bottomLeft[1],
        top: block.topLeft[1]
    }
}

function reflectBallOnBlockCollision(block) {
    const ball = getBallBounds()
    const blockBounds = getBlockBounds(block)
    const overlapX = Math.min(ball.right, blockBounds.right) - Math.max(ball.left, blockBounds.left)
    const overlapY = Math.min(ball.top, blockBounds.top) - Math.max(ball.bottom, blockBounds.bottom)

    if (overlapX <= 0 || overlapY <= 0) {
        return
    }

    if (overlapX < overlapY) {
        xDirection = xDirection > 0 ? -Math.abs(xDirection) : Math.abs(xDirection)
    } else {
        yDirection = yDirection > 0 ? -Math.abs(yDirection) : Math.abs(yDirection)
    }
}

function reflectBallOnPaddle() {
    const ball = getBallBounds()
    const paddleCenter = currentPlayerPosition[0] + blockWidth / 2
    const relativeHit = (ball.centerX - paddleCenter) / (blockWidth / 2)
    const newX = Math.round(relativeHit * 3)
    const minSpeedX = 1

    xDirection = Math.max(minSpeedX, Math.min(3, Math.abs(newX))) * Math.sign(relativeHit || 1)
    yDirection = Math.abs(yDirection)
}

//check for collision
function checkForCollision() {
    const ball = getBallBounds()
    blockHitThisFrame = false // reset a cada frame

    for (let i = 0; i < blocks.length; i++) {
        const blockBounds = getBlockBounds(blocks[i])

        if (ball.right > blockBounds.left &&
            ball.left < blockBounds.right &&
            ball.top > blockBounds.bottom &&
            ball.bottom < blockBounds.top) {
                const allBlocks = document.querySelectorAll('.block')
                allBlocks[i].classList.remove('block')

                if (!blockHitThisFrame) {
                    playBlockHitPool()
                    blockHitThisFrame = true
                }

                reflectBallOnBlockCollision(blocks[i])
                blocks.splice(i, 1)
                blocksDestroyed++
                score += 10
                formatScore()

                if (score % 100 === 0 && lives < maxLives) {
                    lives++
                    updateLivesDisplay()
                    lifeSoundEffect.play()
                }
                if (blocksDestroyed === rows * cols) {
                    resetBall()
                    resetPlayer()
                    resetLevel()
                    blocksDestroyed = 0
                }
                break
        }
    }

    if (ball.left <= 0) {
        xDirection = Math.abs(xDirection)
    }

    if (ball.right >= boardWidth) {
        xDirection = -Math.abs(xDirection)
    }

    if (ball.top >= boardHeight) {
        yDirection = -Math.abs(yDirection)
    }

    const paddleTop = currentPlayerPosition[1] + blockHeight
    if (ball.right > currentPlayerPosition[0] &&
        ball.left < currentPlayerPosition[0] + blockWidth &&
        ball.bottom <= paddleTop &&
        ball.bottom >= currentPlayerPosition[1] &&
        yDirection < 0) {
            reflectBallOnPaddle()
    }

    if (ball.bottom <= 0) {
        loseLife()
    }
}

function changeDirection(){
    if (xDirection === 3 && yDirection === 3) {
        yDirection = -3
        return
    }
    if (xDirection === 3 && yDirection === -3) {
        xDirection = -3
        return
    }
    if (xDirection === -3 && yDirection === -3) {
        yDirection = 3
        return
    }
    if (xDirection === -3 && yDirection === 3) {
        xDirection = 3
        return
    }
}


// -------------------
//  9. Adição de Event Listeners e Intervals
// ------------------
audioButton.addEventListener('click', toggleAudio)
startButton.addEventListener('click', startGame)
highScoresButton.addEventListener('click', displayHighScoresOverlay)

showStartScreen('Pronto para jogar Breakout?', 'Iniciar Jogo')