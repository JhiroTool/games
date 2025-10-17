const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const resetButton = document.getElementById('reset');
const messageDiv = document.getElementById('message');
const scoreboardDiv = document.getElementById('scoreboard');
let currentPlayer = 'X';
let gameState = Array(9).fill(null);
let gameActive = true;

let scores = {
    X: 0,
    O: 0,
    draws: 0
};

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

function handleCellClick(event) {
    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (gameState[clickedCellIndex] !== null || !gameActive) {
        return;
    }

    gameState[clickedCellIndex] = currentPlayer;
    clickedCell.textContent = currentPlayer;
    clickedCell.classList.add(currentPlayer.toLowerCase());

    const winningCombo = checkWinner();
    if (winningCombo) {
        highlightWinner(winningCombo);
        scores[currentPlayer]++;
        saveScores();
        updateScoreboard();
        messageDiv.textContent = `${currentPlayer} wins!`;
        gameActive = false;
        return;
    }

    let roundDraw = !gameState.includes(null);
    if (roundDraw) {
        scores.draws++;
        saveScores();
        updateScoreboard();
        messageDiv.textContent = 'Draw!';
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateMessage();
}

function checkWinner() {
    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        let b = gameState[winCondition[1]];
        let c = gameState[winCondition[2]];
        if (a === null || b === null || c === null) {
            continue;
        }
        if (a === b && b === c) {
            return winCondition;
        }
    }
    return null;
}

function resetGame() {
    gameState = Array(9).fill(null);
    gameActive = true;
    currentPlayer = 'X';
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner');
    });
    updateMessage();
}

function highlightWinner(combo) {
    combo.forEach(index => {
        cells[index].classList.add('winner');
    });
}

function updateMessage() {
    messageDiv.textContent = `Player ${currentPlayer}'s turn`;
}

function loadScores() {
    const saved = localStorage.getItem('ticTacToeScores');
    if (saved) {
        scores = JSON.parse(saved);
    }
}

function saveScores() {
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

function updateScoreboard() {
    scoreboardDiv.textContent = `X Wins: ${scores.X} | O Wins: ${scores.O} | Draws: ${scores.draws}`;
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetButton.addEventListener('click', resetGame);

// Initialize
loadScores();
updateScoreboard();
updateMessage();
