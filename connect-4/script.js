const board = document.getElementById('board');
const columns = document.querySelectorAll('.column');
const messageDiv = document.getElementById('message');
const resetButton = document.getElementById('reset');
const scoreboardDiv = document.getElementById('scoreboard');
const player1WinsSpan = document.getElementById('player1Wins');
const player2WinsSpan = document.getElementById('player2Wins');
const drawCountSpan = document.getElementById('drawCount');
const streakSpan = document.getElementById('streak');
const matchCountSpan = document.getElementById('matchCount');
const historyList = document.getElementById('historyList');

const STORAGE_KEY = 'connect4Stats';
const LEGACY_KEY = 'connect4Scores';

let currentPlayer = 1;
let gameBoard = Array(7).fill().map(() => Array(6).fill(0)); // 7 cols, 6 rows
let gameActive = true;
let winningCells = [];
let matchHistory = [];
let matchCount = 0;
let currentStreakData = { player: null, length: 0 };
let movesThisRound = 0;

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

function handleColumnKeydown(event) {
    const key = event.key;
    const col = parseInt(event.currentTarget.getAttribute('data-col'));
    if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        dropPiece(col);
        return;
    }
    if (key === 'ArrowLeft') {
        event.preventDefault();
        focusColumn((col + 6) % 7);
    } else if (key === 'ArrowRight') {
        event.preventDefault();
        focusColumn((col + 1) % 7);
    }
}

function focusColumn(index) {
    const target = columns[index];
    if (target) {
        target.focus();
    }
}

function dropPiece(col) {
    for (let row = 5; row >= 0; row--) {
        if (gameBoard[col][row] === 0) {
            gameBoard[col][row] = currentPlayer;
            const cell = columns[col].children[5 - row];
            cell.classList.add('dropping');
            movesThisRound++;
            setTimeout(() => {
                cell.classList.add(`player${currentPlayer}`);
                if (checkWin(col, row)) {
                    highlightWinningCells();
                    recordWin(currentPlayer);
                    saveScores();
                    updateScoreboard();
                    updateHistoryUI();
                    messageDiv.textContent = `Player ${currentPlayer} wins!`;
                    gameActive = false;
                    return;
                }
                if (isDraw()) {
                    recordDraw();
                    saveScores();
                    updateScoreboard();
                    updateHistoryUI();
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
    movesThisRound = 0;
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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
                if (parsed.scores) {
                    scores = { 1: parsed.scores[1] ?? 0, 2: parsed.scores[2] ?? 0, draws: parsed.scores.draws ?? 0 };
                }
                if (Array.isArray(parsed.history)) {
                    matchHistory = parsed.history;
                }
                const derivedMatches = (scores[1] + scores[2] + scores.draws);
                if (typeof parsed.matches === 'number' && parsed.matches > 0) {
                    matchCount = parsed.matches;
                } else if (derivedMatches > 0) {
                    matchCount = derivedMatches;
                }
                if (parsed.streak && typeof parsed.streak === 'object') {
                    currentStreakData = { player: parsed.streak.player ?? null, length: parsed.streak.length ?? 0 };
                }
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
            try {
                const parsedLegacy = JSON.parse(legacy);
                scores = { 1: parsedLegacy[1] ?? 0, 2: parsedLegacy[2] ?? 0, draws: parsedLegacy.draws ?? 0 };
                const derivedMatches = scores[1] + scores[2] + scores.draws;
                if (derivedMatches > 0) {
                    matchCount = derivedMatches;
                }
            } catch (error) {
                console.error(error);
            }
        }
    }
}

function saveScores() {
    const payload = {
        scores,
        history: matchHistory,
        matches: matchCount,
        streak: currentStreakData
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function updateScoreboard() {
    const totalMatches = matchCount || (scores[1] + scores[2] + scores.draws);
    const player1Rate = totalMatches ? Math.round((scores[1] / totalMatches) * 100) : 0;
    const player2Rate = totalMatches ? Math.round((scores[2] / totalMatches) * 100) : 0;
    scoreboardDiv.textContent = `Matches played: ${totalMatches} • Player 1 win rate: ${player1Rate}% • Player 2 win rate: ${player2Rate}%`;
    player1WinsSpan.textContent = scores[1];
    player2WinsSpan.textContent = scores[2];
    drawCountSpan.textContent = scores.draws;
    matchCountSpan.textContent = totalMatches;
    streakSpan.textContent = currentStreakData.player ? `Player ${currentStreakData.player} ×${currentStreakData.length}` : '—';
}

function recordWin(player) {
    scores[player]++;
    matchCount++;
    if (currentStreakData.player === player) {
        currentStreakData = { player, length: currentStreakData.length + 1 };
    } else {
        currentStreakData = { player, length: 1 };
    }
    addHistoryEntry({ outcome: 'win', player, moves: movesThisRound, timestamp: Date.now() });
}

function recordDraw() {
    scores.draws++;
    matchCount++;
    currentStreakData = { player: null, length: 0 };
    addHistoryEntry({ outcome: 'draw', moves: movesThisRound, timestamp: Date.now() });
}

function addHistoryEntry(entry) {
    matchHistory.unshift(entry);
    if (matchHistory.length > 8) {
        matchHistory.pop();
    }
}

function updateHistoryUI() {
    historyList.innerHTML = '';
    if (!matchHistory.length) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'empty';
        emptyItem.textContent = 'No matches yet. Start a round to populate your timeline.';
        historyList.appendChild(emptyItem);
        return;
    }
    matchHistory.forEach(entry => {
        const item = document.createElement('li');
        const primary = document.createElement('span');
        const meta = document.createElement('span');
        if (entry.outcome === 'win') {
            primary.textContent = `Player ${entry.player} victory`;
        } else {
            primary.textContent = 'Stalemate';
        }
        const moves = entry.moves || 0;
        const formattedTime = formatTimestamp(entry.timestamp);
        meta.textContent = `${moves} move${moves === 1 ? '' : 's'} • ${formattedTime}`;
        item.appendChild(primary);
        item.appendChild(meta);
        historyList.appendChild(item);
    });
}

function formatTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Just now';
    }
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

columns.forEach(col => col.addEventListener('click', handleColumnClick));
columns.forEach(col => col.addEventListener('keydown', handleColumnKeydown));
resetButton.addEventListener('click', resetGame);

// Initialize
loadScores();
updateScoreboard();
updateMessage();
updateHistoryUI();

