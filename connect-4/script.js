const board = document.getElementById('board');
const columns = document.querySelectorAll('.column');
const messageDiv = document.getElementById('message');
const resetButton = document.getElementById('reset');
const scoreboardDiv = document.getElementById('scoreboard');

let currentPlayer = 1;
let gameBoard = Array(7).fill().map(() => Array(6).fill(0)); // 7 cols, 6 rows
let gameActive = true;
let winningCells = [];

let scores = {
    1: 0,
    2: 0,
    draws: 0
};

function handleColumnClick(event) {
    if (!gameActive) return;
    const col = parseInt(event.currentTarget.getAttribute('data-col'));
    dropPiece(col);
}

function dropPiece(col) {
    for (let row = 5; row >= 0; row--) {
        if (gameBoard[col][row] === 0) {
            gameBoard[col][row] = currentPlayer;
            const cell = columns[col].children[5 - row];
            cell.classList.add('dropping');
            setTimeout(() => {
                cell.classList.add(`player${currentPlayer}`);
                if (checkWin(col, row)) {
                    highlightWinningCells();
                    scores[currentPlayer]++;
                    saveScores();
                    updateScoreboard();
                    messageDiv.textContent = `Player ${currentPlayer} wins!`;
                    gameActive = false;
                    return;
                }
                if (isDraw()) {
                    scores.draws++;
                    saveScores();
                    updateScoreboard();
                    messageDiv.textContent = 'Draw!';
                    gameActive = false;
                    return;
                }
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                updateMessage();
            }, 500); // Match animation duration
            return;
        }
    }
    alert('Column full!');
}

function checkWin(col, row) {
    const directions = [
        [0, 1], // vertical
        [1, 0], // horizontal
        [1, 1], // diagonal \
        [1, -1] // diagonal /
    ];
    for (let [dx, dy] of directions) {
        let count = 1;
        let currentWinningCells = [[col, row]];
        for (let d = 1; d < 4; d++) {
            const x = col + dx * d;
            const y = row + dy * d;
            if (x >= 0 && x < 7 && y >= 0 && y < 6 && gameBoard[x][y] === currentPlayer) {
                count++;
                currentWinningCells.push([x, y]);
            } else break;
        }
        for (let d = 1; d < 4; d++) {
            const x = col - dx * d;
            const y = row - dy * d;
            if (x >= 0 && x < 7 && y >= 0 && y < 6 && gameBoard[x][y] === currentPlayer) {
                count++;
                currentWinningCells.push([x, y]);
            } else break;
        }
        if (count >= 4) {
            winningCells = currentWinningCells;
            return true;
        }
    }
    return false;
}

function highlightWinningCells() {
    winningCells.forEach(([col, row]) => {
        const cell = columns[col].children[5 - row];
        cell.classList.add('winner');
    });
}

function isDraw() {
    return gameBoard.every(col => col.every(cell => cell !== 0));
}

function resetGame() {
    gameBoard = Array(7).fill().map(() => Array(6).fill(0));
    gameActive = true;
    currentPlayer = 1;
    winningCells = [];
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('player1', 'player2', 'dropping', 'winner');
    });
    updateMessage();
    updateScoreboard();
}

function updateMessage() {
    messageDiv.textContent = `Player ${currentPlayer}'s turn`;
}

function loadScores() {
    const saved = localStorage.getItem('connect4Scores');
    if (saved) {
        scores = JSON.parse(saved);
    }
}

function saveScores() {
    localStorage.setItem('connect4Scores', JSON.stringify(scores));
}

function updateScoreboard() {
    scoreboardDiv.textContent = `Player 1 Wins: ${scores[1]} | Player 2 Wins: ${scores[2]} | Draws: ${scores.draws}`;
}

columns.forEach(col => col.addEventListener('click', handleColumnClick));
resetButton.addEventListener('click', resetGame);

// Initialize
loadScores();
updateScoreboard();
updateMessage();
