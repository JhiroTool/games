const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const resetButton = document.getElementById('reset');
const messageDiv = document.getElementById('message');
const scoreboardDiv = document.getElementById('scoreboard');
const xWinsSpan = document.getElementById('xWins');
const oWinsSpan = document.getElementById('oWins');
const drawCountSpan = document.getElementById('drawCount');
const streakSpan = document.getElementById('streak');
const matchCountSpan = document.getElementById('matchCount');
const historyList = document.getElementById('historyList');

const STORAGE_KEY = 'ticTacToeStats';
const LEGACY_KEY = 'ticTacToeScores';

let currentPlayer = 'X';
let gameState = Array(9).fill(null);
let gameActive = true;
let movesThisRound = 0;
let matchHistory = [];
let matchCount = 0;
let currentStreakData = { player: null, length: 0 };

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

    applyMove(clickedCellIndex);
}

function applyMove(index) {
    if (gameState[index] !== null || !gameActive) {
        return;
    }

    const cell = board.querySelector(`.cell[data-index="${index}"]`);
    gameState[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')} ${currentPlayer}`);
    movesThisRound++;

    const winningCombo = checkWinner();
    if (winningCombo) {
        highlightWinner(winningCombo);
        recordWin(currentPlayer);
        saveScores();
        updateScoreboard();
        updateHistoryUI();
        messageDiv.textContent = `${currentPlayer} wins!`;
        gameActive = false;
        return;
    }

    const roundDraw = !gameState.includes(null);
    if (roundDraw) {
        recordDraw();
        saveScores();
        updateScoreboard();
        updateHistoryUI();
        messageDiv.textContent = 'Draw!';
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateMessage();
    focusNextAvailableCell(index);
}

function focusNextAvailableCell(currentIndex) {
    for (let offset = 1; offset < 9; offset++) {
        const nextIndex = (currentIndex + offset) % 9;
        if (gameState[nextIndex] === null) {
            const targetCell = board.querySelector(`.cell[data-index="${nextIndex}"]`);
            targetCell.focus();
            break;
        }
    }
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
    movesThisRound = 0;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner');
        const baseLabel = cell.getAttribute('aria-label');
        if (baseLabel) {
            const cleaned = baseLabel.replace(/ (X|O)$/i, '');
            cell.setAttribute('aria-label', cleaned);
        }
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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
                if (parsed.scores) {
                    scores = { X: parsed.scores.X ?? 0, O: parsed.scores.O ?? 0, draws: parsed.scores.draws ?? 0 };
                }
                if (Array.isArray(parsed.history)) {
                    matchHistory = parsed.history;
                }
                if (typeof parsed.matches === 'number') {
                    matchCount = parsed.matches;
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
                scores = { X: parsedLegacy.X ?? 0, O: parsedLegacy.O ?? 0, draws: parsedLegacy.draws ?? 0 };
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
    const totalMatches = matchCount || (scores.X + scores.O + scores.draws);
    const xRate = totalMatches ? Math.round((scores.X / totalMatches) * 100) : 0;
    const oRate = totalMatches ? Math.round((scores.O / totalMatches) * 100) : 0;
    scoreboardDiv.textContent = `Matches played: ${totalMatches} • X win rate: ${xRate}% • O win rate: ${oRate}%`;
    xWinsSpan.textContent = scores.X;
    oWinsSpan.textContent = scores.O;
    drawCountSpan.textContent = scores.draws;
    matchCountSpan.textContent = totalMatches;
    streakSpan.textContent = currentStreakData.player ? `${currentStreakData.player} ×${currentStreakData.length}` : '—';
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
            primary.textContent = `${entry.player} victory`;
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

function handleKeyNavigation(event) {
    const key = event.key;
    const index = parseInt(event.target.getAttribute('data-index'));
    if (Number.isNaN(index)) return;

    let nextIndex = null;
    if (key === 'ArrowRight') {
        nextIndex = (index + 1) % 9;
    } else if (key === 'ArrowLeft') {
        nextIndex = (index + 8) % 9;
    } else if (key === 'ArrowDown') {
        nextIndex = (index + 3) % 9;
    } else if (key === 'ArrowUp') {
        nextIndex = (index + 6) % 9;
    } else if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        applyMove(index);
    }

    if (nextIndex !== null) {
        event.preventDefault();
        const targetCell = board.querySelector(`.cell[data-index="${nextIndex}"]`);
        if (targetCell) {
            targetCell.focus();
        }
    }
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
cells.forEach(cell => cell.addEventListener('keydown', handleKeyNavigation));
resetButton.addEventListener('click', resetGame);

// Initialize
loadScores();
updateScoreboard();
updateMessage();
updateHistoryUI();
