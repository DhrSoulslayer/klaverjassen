class KlaverjassenGame {
    constructor() {
        this.players = { wij: [], zij: [] };
        this.rounds = [];
        this.currentRound = 1;
        this.selectedTeam = 'wij';
        this.startTime = new Date().toISOString();
        
        this.bindEvents();
        this.loadGameState();
        this.renderTeams();
        this.updateAddRoundButton();
        this.updateGameSummary();
    }



    bindEvents() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('addPlayerBtn').addEventListener('click', () => this.showAddPlayerModal());
        document.getElementById('addRoundBtn').addEventListener('click', () => this.addRound());
        document.getElementById('saveGameBtn').addEventListener('click', () => this.saveCurrentGame());
        document.getElementById('confirmAddPlayer').addEventListener('click', () => this.addPlayer());
        document.getElementById('cancelAddPlayer').addEventListener('click', () => this.hideAddPlayerModal());
        
        // Team selection in modal
        document.querySelectorAll('.team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTeam(e.target.dataset.team);
            });
        });
        
        // Close modal when clicking outside
        document.getElementById('addPlayerModal').addEventListener('click', (e) => {
            if (e.target.id === 'addPlayerModal') {
                this.hideAddPlayerModal();
            }
        });

        // Handle Enter key in player name input
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });
    }

    selectTeam(team) {
        this.selectedTeam = team;
        this.updateTeamSelection();
    }

    updateTeamSelection() {
        // Update team selection buttons
        const wijBtn = document.querySelector('.team-btn[data-team="wij"]');
        const zijBtn = document.querySelector('.team-btn[data-team="zij"]');
        
        if (wijBtn && zijBtn) {
            wijBtn.classList.toggle('active', this.selectedTeam === 'wij');
            zijBtn.classList.toggle('active', this.selectedTeam === 'zij');
        }
    }

    showAddPlayerModal() {
        const modal = document.getElementById('addPlayerModal');
        const wijPlayers = this.players.wij.length;
        const zijPlayers = this.players.zij.length;
        
        // Check if both teams already have 2 players
        if (wijPlayers >= 2 && zijPlayers >= 2) {
            alert('Beide teams hebben al 2 spelers. Je kunt geen spelers meer toevoegen.');
            return;
        }
        
        // Reset form and team selection
        document.getElementById('playerName').value = '';
        
        // Auto-select team that needs players
        if (wijPlayers < 2) {
            this.selectedTeam = 'wij';
        } else if (zijPlayers < 2) {
            this.selectedTeam = 'zij';
        } else {
            // Both teams have 2 players, don't show modal
            return;
        }
        this.updateTeamSelection();
        
        // Show guidance message
        const guidanceElement = document.getElementById('playerGuidance');
        if (guidanceElement) {
            if (wijPlayers === 0 && zijPlayers === 0) {
                guidanceElement.textContent = 'Voeg eerst 2 spelers toe aan beide teams om te kunnen beginnen met spelen.';
                guidanceElement.style.display = 'block';
            } else if (wijPlayers < 2) {
                guidanceElement.textContent = `Team Wij heeft ${wijPlayers}/2 spelers. Voeg nog ${2 - wijPlayers} speler(s) toe aan Team Wij.`;
                guidanceElement.style.display = 'block';
            } else if (zijPlayers < 2) {
                guidanceElement.textContent = `Team Zij heeft ${zijPlayers}/2 spelers. Voeg nog ${2 - zijPlayers} speler(s) toe aan Team Zij.`;
                guidanceElement.style.display = 'block';
            }
        }
        
        modal.style.display = 'block';
        document.getElementById('playerName').focus();
    }

    hideAddPlayerModal() {
        document.getElementById('addPlayerModal').style.display = 'none';
        document.getElementById('playerName').value = '';
        
        // Hide guidance message
        const guidanceElement = document.getElementById('playerGuidance');
        if (guidanceElement) {
            guidanceElement.style.display = 'none';
        }
    }

    addPlayer() {
        const playerName = document.getElementById('playerName').value.trim();
        
        if (!playerName) {
            alert('Voer een naam in voor de speler.');
            return;
        }
        
        // Check if player name already exists in either team
        const allPlayers = [...this.players.wij, ...this.players.zij];
        if (allPlayers.some(player => player.name === playerName)) {
            alert('Er is al een speler met deze naam. Kies een andere naam.');
            return;
        }
        
        // Check if selected team already has 2 players
        if (this.players[this.selectedTeam].length >= 2) {
            const teamName = this.selectedTeam === 'wij' ? 'Team Wij' : 'Team Zij';
            alert(`${teamName} heeft al 2 spelers. Je kunt geen spelers meer toevoegen aan dit team.`);
            return;
        }
        
        // Check if adding this player would exceed the 2-player limit
        if (this.players[this.selectedTeam].length + 1 > 2) {
            const teamName = this.selectedTeam === 'wij' ? 'Team Wij' : 'Team Zij';
            alert(`${teamName} kan maximaal 2 spelers hebben.`);
            return;
        }
        
        // Create player object with proper structure
        const player = {
            name: playerName,
            scores: [],
            total: 0
        };
        
        // Add player to selected team
        this.players[this.selectedTeam].push(player);
        
        // Hide modal
        this.hideAddPlayerModal();
        
        // Update UI
        this.renderTeams();
        this.updateAddRoundButton();
        this.updateGameSummary();
        this.saveGameState();
        
        // Show success message
        const teamName = this.selectedTeam === 'wij' ? 'Team Wij' : 'Team Zij';
        alert(`Speler "${playerName}" succesvol toegevoegd aan ${teamName}!`);
        
        // Check if both teams now have exactly 2 players
        if (this.players.wij.length === 2 && this.players.zij.length === 2) {
            alert('Perfect! Beide teams hebben nu 2 spelers. Je kunt beginnen met het invoeren van scores!');
        }
    }

    removePlayer(playerName, teamName) {
        if (confirm(`Weet je zeker dat je ${playerName} wilt verwijderen uit Team ${teamName === 'wij' ? 'Wij' : 'Zij'}?`)) {
            // Remove player from their team
            this.players[teamName] = this.players[teamName].filter(p => p.name !== playerName);
            
            // Check if removing this player would make the game unplayable
            const wijPlayers = this.players.wij.length;
            const zijPlayers = this.players.zij.length;
            
            if (wijPlayers < 2 || zijPlayers < 2) {
                alert('Let op: Na het verwijderen van deze speler heeft één of beide teams minder dan 2 spelers. Je kunt dan geen rondes meer toevoegen totdat beide teams weer 2 spelers hebben.');
            }
            
            this.saveGameState();
            this.renderTeams();
            this.updateAddRoundButton();
            this.updateGameSummary();
        }
    }

    addRound() {
        // Check if both teams have exactly 2 players
        const wijPlayers = this.players.wij.length;
        const zijPlayers = this.players.zij.length;
        
        if (wijPlayers !== 2 || zijPlayers !== 2) {
            let message = 'Beide teams moeten precies 2 spelers hebben voordat scores kunnen worden ingevoerd.';
            if (wijPlayers < 2) {
                message += ` Team Wij heeft ${wijPlayers}/2 spelers.`;
            } else if (wijPlayers > 2) {
                message += ` Team Wij heeft ${wijPlayers}/2 spelers (te veel).`;
            }
            if (zijPlayers < 2) {
                message += ` Team Zij heeft ${zijPlayers}/2 spelers.`;
            } else if (zijPlayers > 2) {
                message += ` Team Zij heeft ${zijPlayers}/2 spelers (te veel).`;
            }
            alert(message);
            return;
        }
        
        const scoreWij = parseInt(document.getElementById('scoreWij').value) || 0;
        const scoreZij = parseInt(document.getElementById('scoreZij').value) || 0;
        
        if (scoreWij === 0 && scoreZij === 0) {
            alert('Voer minimaal één score in voor een van de teams.');
            return;
        }
        
        const round = {
            round: this.rounds.length + 1,
            scores: { wij: scoreWij, zij: scoreZij },
            timestamp: new Date().toISOString()
        };
        
        this.rounds.push(round);
        
        // Clear input fields
        document.getElementById('scoreWij').value = '';
        document.getElementById('scoreZij').value = '';
        
        // Update scores for all players
        this.recalculateScores();
        
        // Save game state
        this.saveGameState();
        
        // Update UI
        this.updateGameSummary();
        
        // Show success message
        this.showRoundAddedMessage();
    }

    recalculateScores() {
        // Reset all player scores
        for (const team in this.players) {
            this.players[team].forEach(player => {
                player.scores = [];
                player.total = 0;
            });
        }
        
        // Calculate scores from rounds
        this.rounds.forEach(round => {
            for (const team in this.players) {
                this.players[team].forEach(player => {
                    const roundScore = round.scores[team];
                    player.scores.push(roundScore);
                    player.total += roundScore;
                });
            }
        });
        
        // Update team stand after recalculating scores
        this.updateGameSummary();
    }

    renderTeams() {
        this.renderTeam('wij');
        this.renderTeam('zij');
        this.updateAddRoundButton();
    }

    renderTeam(teamName) {
        const container = document.getElementById(`team${teamName.charAt(0).toUpperCase() + teamName.slice(1)}Players`);
        const players = this.players[teamName];
        
        if (players.length === 0) {
            container.innerHTML = `
                <div class="team-players empty">
                    <p>Nog geen spelers in team ${teamName === 'wij' ? 'Wij' : 'Zij'}</p>
                    <p class="team-requirement">Minimaal 2 spelers vereist</p>
                </div>
            `;
            return;
        }
        
        if (players.length < 2) {
            container.innerHTML = `
                <div class="team-players incomplete">
                    ${players.map(player => `
                        <div class="player-card team-${teamName}">
                            <div class="player-header">
                                <div class="player-name">${player.name}</div>
                                <div class="player-total">${player.total}</div>
                            </div>
                            <div class="player-scores">
                                ${player.scores.map(score => `
                                    <span class="score-chip ${score < 0 ? 'negative' : ''}">${score}</span>
                                `).join('')}
                            </div>
                            <button class="btn btn-secondary" style="margin-top: 10px; width: 100%; font-size: 0.9rem;" 
                                    onclick="game.removePlayer('${player.name}', '${teamName}')">
                                Verwijderen
                            </button>
                        </div>
                    `).join('')}
                    <div class="team-status">
                        <p class="team-requirement">${players.length}/2 spelers - Voeg nog ${2 - players.length} speler(s) toe</p>
                    </div>
                </div>
            `;
            return;
        }
        
        if (players.length > 2) {
            container.innerHTML = `
                <div class="team-players overflow">
                    ${players.map(player => `
                        <div class="player-card team-${teamName}">
                            <div class="player-header">
                                <div class="player-name">${player.name}</div>
                                <div class="player-total">${player.total}</div>
                            </div>
                            <div class="player-scores">
                                ${player.scores.map(score => `
                                    <span class="score-chip ${score < 0 ? 'negative' : ''}">${score}</span>
                                `).join('')}
                            </div>
                            <button class="btn btn-secondary" style="margin-top: 10px; width: 100%; font-size: 0.9rem;" 
                                    onclick="game.removePlayer('${player.name}', '${teamName}')">
                                Verwijderen
                            </button>
                        </div>
                    `).join('')}
                    <div class="team-status error">
                        <p class="team-requirement error">${players.length}/2 spelers - TE VEEL SPELERS! Verwijder ${players.length - 2} speler(s)</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = players.map(player => `
            <div class="player-card team-${teamName}">
                <div class="player-header">
                    <div class="player-name">${player.name}</div>
                    <div class="player-total">${player.total}</div>
                </div>
                <div class="player-scores">
                    ${player.scores.map(score => `
                        <span class="score-chip ${score < 0 ? 'negative' : ''}">${score}</span>
                    `).join('')}
                </div>
                <button class="btn btn-secondary" style="margin-top: 10px; width: 100%; font-size: 0.9rem;" 
                        onclick="game.removePlayer('${player.name}', '${teamName}')">
                    Verwijderen
                </button>
            </div>
        `).join('');
    }

    updateAddRoundButton() {
        const addRoundBtn = document.getElementById('addRoundBtn');
        const wijPlayers = this.players.wij.length;
        const zijPlayers = this.players.zij.length;
        
        if (wijPlayers === 0 && zijPlayers === 0) {
            addRoundBtn.disabled = true;
            addRoundBtn.textContent = 'Voeg eerst spelers toe';
            addRoundBtn.style.opacity = '0.6';
        } else if (wijPlayers === 0 || zijPlayers === 0) {
            addRoundBtn.disabled = true;
            addRoundBtn.textContent = 'Beide teams moeten spelers hebben';
            addRoundBtn.style.opacity = '0.6';
        } else if (wijPlayers !== 2 || zijPlayers !== 2) {
            addRoundBtn.disabled = true;
            if (wijPlayers < 2 || zijPlayers < 2) {
                addRoundBtn.textContent = 'Beide teams moeten precies 2 spelers hebben';
            } else {
                addRoundBtn.textContent = 'Beide teams mogen maximaal 2 spelers hebben';
            }
            addRoundBtn.style.opacity = '0.6';
        } else {
            addRoundBtn.disabled = false;
            addRoundBtn.textContent = 'Ronde Toevoegen';
            addRoundBtn.style.opacity = '1';
        }
    }

    updateGameSummary() {
        const summary = document.getElementById('gameSummary');
        const content = document.getElementById('summaryContent');
        
        if (this.rounds.length === 0) {
            summary.style.display = 'none';
            return;
        }
        
        summary.style.display = 'block';
        
        // Calculate team totals
        const teamTotals = {
            wij: this.players.wij.reduce((sum, player) => sum + player.total, 0),
            zij: this.players.zij.reduce((sum, player) => sum + player.total, 0)
        };
        
        // Update team stand bovenaan
        this.updateTeamStand(teamTotals.wij, teamTotals.zij);
        
        // Determine winner
        const winner = teamTotals.wij > teamTotals.zij ? 'wij' : 
                      teamTotals.zij > teamTotals.wij ? 'zij' : 'tie';
        
        content.innerHTML = `
            <div class="summary-row">
                <span>Rondes gespeeld:</span>
                <span>${this.rounds.length}</span>
            </div>
            <div class="summary-row ${winner === 'wij' ? 'winner' : ''}">
                <span>Team Wij:</span>
                <span>${teamTotals.wij}</span>
            </div>
            <div class="summary-row ${winner === 'zij' ? 'winner' : ''}">
                <span>Team Zij:</span>
                <span>${teamTotals.zij}</span>
            </div>
            <div class="summary-row ${winner === 'tie' ? 'winner' : ''}">
                <span>${winner === 'tie' ? 'Gelijkspel!' : `Team ${winner === 'wij' ? 'Wij' : 'Zij'} wint!`}</span>
                <span>${winner === 'tie' ? '🤝' : '🏆'}</span>
            </div>
        `;
    }
    
    updateTeamStand(wijTotal, zijTotal) {
        const wijElement = document.getElementById('teamWijTotal');
        const zijElement = document.getElementById('teamZijTotal');
        
        if (wijElement && zijElement) {
            wijElement.textContent = wijTotal;
            zijElement.textContent = zijTotal;
        }
    }

    async newGame() {
        // Save current game to database if there are rounds
        if (this.rounds.length > 0) {
            await this.saveGameToDatabase();
        }
        
        this.players = { wij: [], zij: [] };
        this.rounds = [];
        this.startTime = new Date().toISOString();
        
        this.renderTeams();
        this.updateAddRoundButton();
        this.updateGameSummary();
        this.updateTeamStand(0, 0); // Reset team stand
        this.saveGameState();
    }

    showRoundAddedMessage() {
        // Create a temporary success message
        const message = document.createElement('div');
        message.textContent = 'Ronde toegevoegd!';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(message);
            }, 300);
        }, 2000);
    }

    saveGameState() {
        const gameState = {
            players: this.players,
            rounds: this.rounds,
            currentRound: this.currentRound
        };
        localStorage.setItem('klaverjassen-game', JSON.stringify(gameState));
    }

    loadGameState() {
        const saved = localStorage.getItem('klaverjassen-game');
        if (saved) {
            try {
                const gameState = JSON.parse(saved);
                this.players = gameState.players || { wij: [], zij: [] };
                this.rounds = gameState.rounds || [];
                this.currentRound = gameState.currentRound || 1;
                
                // Convert old player format (strings) to new format (objects) if needed
                for (const team in this.players) {
                    this.players[team] = this.players[team].map(player => {
                        if (typeof player === 'string') {
                            return { name: player, scores: [], total: 0 };
                        }
                        return player;
                    });
                }
            } catch (e) {
                console.error('Error loading game state:', e);
                this.players = { wij: [], zij: [] };
                this.rounds = [];
                this.currentRound = 1;
            }
        }
    }

    async saveGameToDatabase() {
        try {
            const gameData = {
                players: this.players,
                rounds: this.rounds,
                teamTotals: this.calculateTeamTotals(),
                winner: this.determineWinner(),
                start_time: this.startTime
            };

            const response = await fetch('/api/save-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameData)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('Game saved to database with ID:', result.game_id);
                return true;
            } else {
                console.error('Failed to save game:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Error saving game to database:', error);
            return false;
        }
    }

    async saveCurrentGame() {
        if (this.rounds.length === 0) {
            alert('Er zijn nog geen rondes gespeeld om op te slaan.');
            return;
        }
        
        try {
            const success = await this.saveGameToDatabase();
            if (success) {
                alert('Spel succesvol opgeslagen in de database!');
            } else {
                alert('Fout bij het opslaan van het spel. Probeer het opnieuw.');
            }
        } catch (error) {
            console.error('Error saving current game:', error);
            alert('Fout bij het opslaan van het spel. Probeer het opnieuw.');
        }
    }

    calculateTeamTotals() {
        const totals = { wij: 0, zij: 0 };
        
        this.rounds.forEach(round => {
            if (round.scores && round.scores.wij !== undefined && round.scores.zij !== undefined) {
                totals.wij += round.scores.wij;
                totals.zij += round.scores.zij;
            }
        });
        
        return totals;
    }

    determineWinner() {
        const totals = this.calculateTeamTotals();
        if (totals.wij > totals.zij) return 'Wij';
        if (totals.zij > totals.wij) return 'Zij';
        return 'Gelijkspel';
    }
}

// Add CSS animations for the success message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Add admin link to the page
function addAdminLink() {
    const header = document.querySelector('header');
    const adminLink = document.createElement('a');
    adminLink.href = '/admin';
    adminLink.textContent = '📊 Admin';
    adminLink.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        text-decoration: none;
        font-size: 0.9rem;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
    `;
    
    adminLink.addEventListener('mouseenter', () => {
        adminLink.style.background = 'rgba(255, 255, 255, 0.3)';
        adminLink.style.transform = 'translateY(-2px)';
    });
    
    adminLink.addEventListener('mouseleave', () => {
        adminLink.style.background = 'rgba(255, 255, 255, 0.2)';
        adminLink.style.transform = 'translateY(0)';
    });
    
    header.appendChild(adminLink);
}

// Initialize the game and add admin link
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new KlaverjassenGame();
    addAdminLink();
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(error => console.log('ServiceWorker registration failed:', error));
    }
});
