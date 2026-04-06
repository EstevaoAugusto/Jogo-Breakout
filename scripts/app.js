// ------------------------------------
// 1. Configurações e constantes
// ------------------------------------
const blockBreakSoundEffect = new Audio('./sounds/block-break.mp3')
const lifeSoundEffect = new Audio('./sounds/mario-1up.mp3')
const deathSoundEffect = new Audio('./sounds/death-sound-effect.mp3')
const gameOverSoundEffect = new Audio('./sounds/mario-game-over.mp3')
const grid = document.querySelector('.grid')
const scoreDisplay = document.querySelector('#score')
const mainContainer = document.querySelector('.container')
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

let audioAllowed = true
let blockDestroyed = 0
let lives = 3
let blockHitThisFrame = false
let timerId
let score = 0
let gameData = {
    highscores: [
        
    ]
}

// -----------------------------
// 2. Player e bola
// -----------------------------
const useStart = [boardWidth / 2 - blockWidth / 2, 10]
let currentPlayerPosition = useStart

const ballStart = [boardWidth / 2 - ballDiameter / 2, 40]
let currentBallPosition = ballStart


const blockHitPool = []
const poolSize = 5

for (let i = 0; i < poolSize; i++) {
    blockHitPool.push(new Audio('./sounds/block-break.mp3'))
}

let currentIndex = 0

function playBlockHitPool() {
    const audio = blockHitPool[currentIndex]
    audio.currentTime = 0
    audio.play()
    currentIndex = (currentIndex + 1) % poolSize
}

// -----------------------------
// 3. Classe Block
// -----------------------------
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
// 4. Blocos
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

// função para tocar o efeito sonoro desde o inicio
function playSingleSound(soundEffect){
    soundEffect.currentTime = 0 // reinicia o som
    soundEffect.play()          // toca
}

// Função de Formatação de Pontos
function formatScore(){
    scoreDisplay.innerHTML = String(score).padStart(7, '0')
}
formatScore()

function loseLife() {
    lives--                  // diminui 1 vida
    updateLivesDisplay()     // atualiza o display de corações

    if (lives === 0) {       // se não restar vidas
        clearInterval(timerId)
        scoreDisplay.innerHTML = 'Game Over'
        playSingleSound(gameOverSoundEffect)
        document.removeEventListener('keydown', moveUser)
    } else {
        // pausa antes de renascer
        clearInterval(timerId)        // pausa a bola
        document.removeEventListener('keydown', moveUser)
        playSingleSound(deathSoundEffect)
        
        setTimeout(() => {
            resetBall()               // reposiciona bola
            resetPlayer()             // reposiciona player
            scoreDisplay.innerHTML = String(score).padStart(7, '0')
            document.addEventListener('keydown', moveUser)
            timerId = setInterval(moveBall, 30)  // retoma o jogo
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
    currentBallPosition[0] += xDirection
    currentBallPosition[1] += yDirection
    drawBall()
    checkForCollision()
}

//check for collision
function checkForCollision() {
    blockHitThisFrame = false // reset a cada frame
    // check for block collision
    for (let i = 0; i < blocks.length; i++) {
        if (currentBallPosition[0] > blocks[i].bottomLeft[0] &&
            currentBallPosition[0] < blocks[i].bottomRight[0] &&
            (currentBallPosition[1] + ballDiameter) > blocks[i].bottomLeft[1] &&
            currentBallPosition[1] < blocks[i].topLeft[1]) {
                const allBlocks = document.querySelectorAll('.block')
                allBlocks[i].classList.remove('block')
                
                if(!blockHitThisFrame){
                    playBlockHitPool()
                    blockHitThisFrame = true
                }
                
                blocks.splice(i, 1)
                changeDirection()
                blockDestroyed++
                score += 10
                formatScore()
                if(score % 100 == 0 && lives < maxLives){
                    lives++
                    updateLivesDisplay()
                    lifeSoundEffect.play()
                }
                
        }
    }


    if (currentBallPosition[0] >= (boardWidth - ballDiameter) ||
        currentBallPosition[0] <= 0 ||
        currentBallPosition[1] >= (boardHeight - ballDiameter)) {
        changeDirection()
    }

    //check for user collision
    if (currentBallPosition[0] > currentPlayerPosition[0] &&
        currentBallPosition[0] < currentPlayerPosition[0] + blockWidth &&
        (currentBallPosition[1] > currentPlayerPosition[1] && 
            currentBallPosition[1] < currentPlayerPosition[1] + blockHeight)){
            changeDirection()
        }
    
    // game over
    if (currentBallPosition[1] <= 0) {
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



timerId = setInterval(moveBall, 30)

document.addEventListener('keydown', moveUser)