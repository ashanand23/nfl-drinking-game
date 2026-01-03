// Game state
let gameState = {
    team1: '',
    team2: '',
    playerCount: 0,
    currentPlayerIndex: 0,
    players: [], // Each player will have: {name, team, points}
    selectedTeam: null,
    categories: {},
    currentCategory: '',
    resultTimeout: null,
    teamThatMadePlay: null,
    previousScreen: ''
};

// Utility function to flip between screens with card deck animation
function flipToScreen(currentScreen, nextScreen) {
    const current = document.getElementById(currentScreen);
    const next = document.getElementById(nextScreen);

    // Discard current card to bottom of deck
    current.classList.add('discarding');

    // Wait for discard animation to complete, then show next card in waiting state
    setTimeout(() => {
        current.classList.add('hidden');
        current.classList.remove('discarding');

        // Show next card face-down in waiting state
        next.classList.remove('hidden');
        next.classList.add('waiting');

        // Add card back overlay if it doesn't exist
        if (!next.querySelector('.card-back-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'card-back-overlay';
            overlay.innerHTML = `
                <div class="card-back-pattern"></div>
                <h1>NFL</h1>
                <h2>DRINKING GAME</h2>
                <p>TAP TO CONTINUE</p>
            `;
            next.querySelector('.card-inner').insertBefore(overlay, next.querySelector('.card-front'));
        }

        // Wait for user click to flip card
        const handleClick = (e) => {
            // Prevent clicks on buttons from triggering flip
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
                return;
            }

            next.removeEventListener('click', handleClick);
            next.classList.remove('waiting');

            // Add deck lifting class to body
            document.body.classList.add('deck-lifting');

            // Flip card animation
            next.classList.add('drawing');

            // Remove deck lifting class after card is drawn
            setTimeout(() => {
                document.body.classList.remove('deck-lifting');
            }, 200);

            // Clean up drawing animation
            setTimeout(() => {
                next.classList.remove('drawing');
            }, 800);
        };

        next.addEventListener('click', handleClick);
    }, 1000);
}

// Reveal welcome screen from card back
function revealWelcome() {
    flipToScreen('card-back', 'welcome-screen');
}

// Start the game
function startGame() {
    flipToScreen('welcome-screen', 'team-screen');
}

// Submit team names
function submitTeams() {
    const team1 = document.getElementById('team1').value.trim();
    const team2 = document.getElementById('team2').value.trim();

    if (!team1 || !team2) {
        alert('Please enter both team names!');
        return;
    }

    gameState.team1 = team1;
    gameState.team2 = team2;

    // Update team buttons for player selection
    document.getElementById('teamBtn1').textContent = team1;
    document.getElementById('teamBtn2').textContent = team2;

    flipToScreen('team-screen', 'player-count-screen');
}

// Submit player count
function submitPlayerCount() {
    const count = parseInt(document.getElementById('playerCount').value);

    if (!count || count < 1) {
        alert('Please enter a valid number of players!');
        return;
    }

    gameState.playerCount = count;
    gameState.currentPlayerIndex = 0;
    gameState.players = [];

    updatePlayerEntryScreen();
    flipToScreen('player-count-screen', 'player-entry-screen');
}

// Update player entry screen
function updatePlayerEntryScreen() {
    document.getElementById('currentPlayerNum').textContent = gameState.currentPlayerIndex + 1;
    document.getElementById('playerName').value = '';
    gameState.selectedTeam = null;

    // Reset team button selection
    document.getElementById('teamBtn1').classList.remove('selected');
    document.getElementById('teamBtn2').classList.remove('selected');
}

// Select team for current player
function selectTeam(teamNum) {
    gameState.selectedTeam = teamNum;

    document.getElementById('teamBtn1').classList.remove('selected');
    document.getElementById('teamBtn2').classList.remove('selected');

    if (teamNum === 1) {
        document.getElementById('teamBtn1').classList.add('selected');
    } else {
        document.getElementById('teamBtn2').classList.add('selected');
    }
}

// Submit player information
function submitPlayer() {
    const playerName = document.getElementById('playerName').value.trim();

    if (!playerName) {
        alert('Please enter a player name!');
        return;
    }

    if (gameState.selectedTeam === null) {
        alert('Please select a team!');
        return;
    }

    // Add player to array with points initialized to 0
    gameState.players.push({
        name: playerName,
        team: gameState.selectedTeam === 1 ? gameState.team1 : gameState.team2,
        points: 0
    });

    gameState.currentPlayerIndex++;

    // Check if we have all players
    if (gameState.currentPlayerIndex < gameState.playerCount) {
        // Use card deck animation for same screen update
        const screen = document.getElementById('player-entry-screen');
        screen.classList.add('discarding');

        setTimeout(() => {
            updatePlayerEntryScreen();
            screen.classList.remove('discarding');
            screen.classList.add('drawing');

            setTimeout(() => {
                screen.classList.remove('drawing');
            }, 800);
        }, 1000);
    } else {
        // All players entered, show ready screen
        showReadyScreen();
    }
}

// Show ready to play screen
function showReadyScreen() {
    const summary = gameState.players.map(p =>
        `${p.name} - ${p.team}`
    ).join('<br>');

    document.getElementById('playerSummary').innerHTML = summary;
    flipToScreen('player-entry-screen', 'ready-screen');
}

// Show categories - now goes directly to category selection
async function showCategories() {
    // Load categories from backend if not already loaded
    if (Object.keys(gameState.categories).length === 0) {
        try {
            const response = await fetch('/api/categories');
            gameState.categories = await response.json();
        } catch (error) {
            console.error('Error loading categories:', error);
            alert('Error loading categories!');
            return;
        }
    }

    // Set up team play buttons for later use
    document.getElementById('teamPlay1').textContent = gameState.team1;
    document.getElementById('teamPlay2').textContent = gameState.team2;

    flipToScreen('ready-screen', 'category-screen');
}

// Select which team made the play
function selectTeamPlay(teamNum) {
    const teamThatMadePlay = teamNum === 1 ? gameState.team1 : gameState.team2;
    gameState.teamThatMadePlay = teamThatMadePlay;

    // Award points to players who picked the OTHER team
    gameState.players.forEach(player => {
        if (player.team !== teamThatMadePlay) {
            player.points += 1;
        }
    });

    flipToScreen('team-play-screen', 'event-screen');
}

// Select a category and show team play selection
function selectCategory(category) {
    gameState.currentCategory = category;

    // Get events for this category
    const events = gameState.categories[category];

    if (!events) {
        alert('Category not found!');
        return;
    }

    // Populate event grid for later
    const eventGrid = document.getElementById('eventGrid');
    eventGrid.innerHTML = '';

    // Update title
    document.getElementById('eventCategoryTitle').textContent = category;

    // Create button for each event
    Object.keys(events).forEach(eventName => {
        const button = document.createElement('button');
        button.className = 'btn-event';
        button.textContent = eventName;
        button.onclick = () => selectEvent(eventName, events[eventName]);
        eventGrid.appendChild(button);
    });

    // First show team play selection
    flipToScreen('category-screen', 'team-play-screen');
}

// Select an event and get random outcome
async function selectEvent(eventName, severity) {
    try {
        const response = await fetch(`/api/outcome/${encodeURIComponent(severity)}`);
        const data = await response.json();

        if (data.error) {
            alert('Error getting outcome!');
            return;
        }

        // Show result with the selected event and random outcome
        showResult(eventName, data.outcome);
    } catch (error) {
        console.error('Error:', error);
        alert('Error connecting to server!');
    }
}

// Show result screen
function showResult(event, outcome) {
    document.getElementById('resultEvent').textContent = event;
    document.getElementById('resultOutcome').textContent = outcome;

    flipToScreen('event-screen', 'result-screen');

    // Clear any existing timeout
    if (gameState.resultTimeout) {
        clearTimeout(gameState.resultTimeout);
    }

    // Auto-return to categories after 15 seconds
    gameState.resultTimeout = setTimeout(() => {
        returnToCategories();
    }, 15000);
}

// Return to category screen
function returnToCategories() {
    // Clear timeout if exists
    if (gameState.resultTimeout) {
        clearTimeout(gameState.resultTimeout);
        gameState.resultTimeout = null;
    }

    flipToScreen('result-screen', 'category-screen');
}

// Show scoreboard
function showScoreboard() {
    // Save current screen
    const currentScreen = document.querySelector('.card:not(.hidden)');
    gameState.previousScreen = currentScreen ? currentScreen.id : 'category-screen';

    // Sort players by points (lowest to highest)
    const sortedPlayers = [...gameState.players].sort((a, b) => a.points - b.points);

    let scoreHTML = '<div class="score-list">';
    sortedPlayers.forEach((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        scoreHTML += `
            <div class="score-item">
                <span class="rank">${medal} ${rank}.</span>
                <span class="player-name-score">${player.name}</span>
                <span class="player-team-score">(${player.team})</span>
                <span class="player-points">${player.points} pts</span>
            </div>
        `;
    });
    scoreHTML += '</div>';

    document.getElementById('scoreboardContent').innerHTML = scoreHTML;
    flipToScreen(gameState.previousScreen, 'scoreboard-screen');
}

// Go back from scoreboard
function backFromScoreboard() {
    flipToScreen('scoreboard-screen', gameState.previousScreen);
}

// Go back from event screen to category screen
function backToCategories() {
    flipToScreen('event-screen', 'category-screen');
}

// Finish game and show final score screen
function finishGame() {
    // Update labels with actual team names
    document.getElementById('team1ScoreLabel').textContent = `${gameState.team1} Score:`;
    document.getElementById('team2ScoreLabel').textContent = `${gameState.team2} Score:`;

    flipToScreen('category-screen', 'final-score-screen');
}

// Submit final score and determine losers
function submitFinalScore() {
    const team1Score = parseInt(document.getElementById('team1Score').value);
    const team2Score = parseInt(document.getElementById('team2Score').value);

    if (isNaN(team1Score) || isNaN(team2Score)) {
        alert('Please enter valid scores for both teams!');
        return;
    }

    // Determine winning team
    let winningTeam;
    if (team1Score > team2Score) {
        winningTeam = gameState.team1;
    } else if (team2Score > team1Score) {
        winningTeam = gameState.team2;
    } else {
        // It's a tie
        showFinalResults(null, team1Score, team2Score);
        return;
    }

    showFinalResults(winningTeam, team1Score, team2Score);
}

// Show final results with losers
function showFinalResults(winningTeam, team1Score, team2Score) {
    const resultsDiv = document.getElementById('finalResults');

    if (winningTeam === null) {
        // Tie game
        resultsDiv.innerHTML = `
            <h3>It's a Tie!</h3>
            <p class="score-display">${gameState.team1} ${team1Score} - ${team2Score} ${gameState.team2}</p>
            <p class="everyone-drinks">EVERYONE TAKES A SHOT!</p>
        `;
    } else {
        // Determine losing team
        const losingTeam = winningTeam === gameState.team1 ? gameState.team2 : gameState.team1;

        // Add 3 points to players who picked the losing team
        gameState.players.forEach(player => {
            if (player.team === losingTeam) {
                player.points += 3;
            }
        });

        // Find players who picked the losing team
        const losingPlayers = gameState.players.filter(player => player.team === losingTeam);

        let resultsHTML = `
            <h3>${winningTeam} Wins!</h3>
            <p class="score-display">${gameState.team1} ${team1Score} - ${team2Score} ${gameState.team2}</p>
            <div class="losers-section">
        `;

        if (losingPlayers.length > 0) {
            resultsHTML += `<h3 class="losers-title">The Following Players Must Take A Shot:</h3>`;
            losingPlayers.forEach(player => {
                resultsHTML += `<p class="loser-name">${player.name}</p>`;
            });
        }

        resultsHTML += `</div>`;
        resultsDiv.innerHTML = resultsHTML;
    }

    // Show final scores after a delay
    setTimeout(() => {
        showFinalWinner(team1Score, team2Score, winningTeam);
    }, 5000);

    flipToScreen('final-score-screen', 'final-result-screen');
}

// Show final winner with player scores
function showFinalWinner(team1Score, team2Score, winningTeam) {
    const resultsDiv = document.getElementById('finalResults');

    // Sort players by points (lowest to highest) - lowest wins!
    const sortedPlayers = [...gameState.players].sort((a, b) => a.points - b.points);
    const winner = sortedPlayers[0];

    let finalHTML = `
        <h2>🏆 GAME RESULTS 🏆</h2>
        <h3>NFL Game Score</h3>
        <p class="score-display">${gameState.team1} ${team1Score} - ${team2Score} ${gameState.team2}</p>
        <h3 class="winner-title">DRINKING GAME WINNER:</h3>
        <p class="winner-name">${winner.name}</p>
        <p class="winner-subtitle">With only ${winner.points} points!</p>
        <div class="final-scores-section">
            <h3>Final Player Scores:</h3>
    `;

    sortedPlayers.forEach((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        finalHTML += `
            <div class="final-score-item ${rank === 1 ? 'winner-highlight' : ''}">
                <span>${medal} ${rank}. ${player.name}</span>
                <span class="final-points">${player.points} pts</span>
            </div>
        `;
    });

    finalHTML += `
        </div>
        <p class="tap-to-restart">Tap anywhere to play again</p>
    `;

    resultsDiv.innerHTML = finalHTML;
}

// Return to welcome screen
function returnToWelcome() {
    // Reset game state
    gameState = {
        team1: '',
        team2: '',
        playerCount: 0,
        currentPlayerIndex: 0,
        players: [],
        selectedTeam: null,
        categories: {},
        currentCategory: '',
        resultTimeout: null,
        teamThatMadePlay: null,
        previousScreen: ''
    };

    flipToScreen('final-result-screen', 'welcome-screen');
}
