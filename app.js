// Utility function to escape HTML and prevent XSS
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// 152 kaartpunten (+10 laatste slag aan winnaar) = 162 rondepunten totaal
const CARD_POINTS_TOTAL = 152;
const NAT_MAX_TRICK_POINTS = 81;
const WINNING_SCORE = 1600;

class KlaverjassenGame {
    constructor() {
        this.players = { wij: [], zij: [] };
        this.rounds = [];
        this.currentRound = 1;
        this.selectedTeam = 'wij';
        this.startTime = new Date().toISOString();
        this.gameStarted = false;
        
        this.bindEvents();
        this.loadGameState();
        this.checkGameState();
        this.renderTeams();
        this.updateAddRoundButton();
        this.updateGameSummary();
        this.renderRoundsList();
        this.setupScorePreview();
        this.setupAutoCalculate();
    }



    bindEvents() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('addPlayerBtn').addEventListener('click', () => this.showAddPlayerModal());
        document.getElementById('addRoundBtn').addEventListener('click', () => this.addRound());
        document.getElementById('saveGameBtn').addEventListener('click', () => this.saveCurrentGame());
        document.getElementById('confirmAddPlayer').addEventListener('click', () => this.addPlayer());
        document.getElementById('cancelAddPlayer').addEventListener('click', () => this.hideAddPlayerModal());
        
        // Setup modal events
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGameFromSetup());
        document.getElementById('cancelSetupBtn').addEventListener('click', () => this.cancelSetup());
        
        // Handle Enter key in setup inputs
        ['playerWij1', 'playerWij2', 'playerZij1', 'playerZij2'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextId = this.getNextSetupInput(id);
                        if (nextId) {
                            document.getElementById(nextId).focus();
                        } else {
                            this.startGameFromSetup();
                        }
                    }
                });
            }
        });
        
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

        document.querySelectorAll('.roem-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const team = e.currentTarget.dataset.team;
                const value = parseInt(e.currentTarget.dataset.value) || 0;
                this.adjustRoem(team, value);
            });
        });

        document.querySelectorAll('.roem-reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const team = e.currentTarget.dataset.team;
                this.setRoemValue(team, 0);
                this.updateScorePreview();
            });
        });

        const roundsListContent = document.getElementById('roundsListContent');
        if (roundsListContent) {
            roundsListContent.addEventListener('click', (event) => {
                const actionButton = event.target.closest('[data-round-action]');
                if (!actionButton) return;

                const action = actionButton.dataset.roundAction;
                const roundIndex = parseInt(actionButton.dataset.roundIndex, 10);
                if (Number.isNaN(roundIndex)) return;

                if (action === 'replay') {
                    this.replayRound(roundIndex);
                } else if (action === 'edit') {
                    this.editRound(roundIndex);
                } else if (action === 'remove') {
                    this.removeRound(roundIndex);
                }
            });
        }
    }

    setupScorePreview() {
        const inputs = [
            'cardPointsWij', 'cardPointsZij', 'whoPlayed',
            'lastTrickWinner', 'pitWij', 'pitZij',
            'roemWij', 'roemZij'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateScorePreview());
                element.addEventListener('input', () => this.updateScorePreview());
            }
        });
    }

    updateScorePreview() {
        const preview = document.getElementById('scorePreview');
        const content = document.getElementById('previewContent');
        
        const cardPointsWij = parseInt(document.getElementById('cardPointsWij').value) || 0;
        const cardPointsZij = parseInt(document.getElementById('cardPointsZij').value) || 0;
        const roemWij = this.calculateRoem('wij');
        const roemZij = this.calculateRoem('zij');
        const lastTrickWinner = document.getElementById('lastTrickWinner').value;
        const pitWij = document.getElementById('pitWij').checked;
        const pitZij = document.getElementById('pitZij').checked;
        const whoPlayed = document.getElementById('whoPlayed').value;
        const autoPitWij = cardPointsWij === CARD_POINTS_TOTAL && cardPointsZij === 0;
        const autoPitZij = cardPointsZij === CARD_POINTS_TOTAL && cardPointsWij === 0;
        const pitWijApplied = pitWij || autoPitWij;
        const pitZijApplied = pitZij || autoPitZij;

        if (cardPointsWij === 0 && cardPointsZij === 0 && roemWij === 0 && roemZij === 0) {
            preview.style.display = 'none';
            return;
        }

        let scoreWij = cardPointsWij + roemWij;
        let scoreZij = cardPointsZij + roemZij;

        if (lastTrickWinner === 'wij') scoreWij += 10;
        if (lastTrickWinner === 'zij') scoreZij += 10;
        if (pitWijApplied) scoreWij += 100;
        if (pitZijApplied) scoreZij += 100;

        // Check for nat (vragende partij is nat bij 81-81, dus <= 81 slagpunten)
        let natWarning = '';
        if (whoPlayed && cardPointsWij + cardPointsZij === CARD_POINTS_TOTAL) {
            const playingTeamCardPoints = whoPlayed === 'wij' ? cardPointsWij : cardPointsZij;
            const playingTeamLastTrick = lastTrickWinner === whoPlayed ? 10 : 0;
            const playingTeamTrickPoints = playingTeamCardPoints + playingTeamLastTrick;
            if (playingTeamTrickPoints <= NAT_MAX_TRICK_POINTS) {
                const natTeamName = whoPlayed === 'wij' ? 'Team Wij' : 'Team Zij';
                natWarning = `<div class="nat-warning">⚠️ NAT: ${escapeHtml(natTeamName)} heeft ≤ ${NAT_MAX_TRICK_POINTS} slagpunten! Alle punten gaan naar tegenstander.</div>`;
                if (whoPlayed === 'wij') {
                    scoreZij = scoreWij + scoreZij;
                    scoreWij = 0;
                } else {
                    scoreWij = scoreWij + scoreZij;
                    scoreZij = 0;
                }
            }
        }

        // Validate card points
        let validationWarning = '';
        if (cardPointsWij + cardPointsZij !== CARD_POINTS_TOTAL && cardPointsWij > 0 && cardPointsZij > 0) {
            validationWarning = `<div class="validation-warning">⚠️ Kaartpunten tellen op tot ${escapeHtml(cardPointsWij + cardPointsZij)}, moeten ${CARD_POINTS_TOTAL} zijn.</div>`;
        }

        const escapedCardPointsWij = escapeHtml(cardPointsWij);
        const escapedCardPointsZij = escapeHtml(cardPointsZij);
        const escapedRoemWij = escapeHtml(roemWij);
        const escapedRoemZij = escapeHtml(roemZij);
        const escapedScoreWij = escapeHtml(scoreWij);
        const escapedScoreZij = escapeHtml(scoreZij);
        
        content.innerHTML = `
            ${validationWarning}
            ${natWarning}
            <div class="preview-row">
                <div class="preview-team">
                    <strong>Team Wij:</strong>
                    <div>Kaarten: ${escapedCardPointsWij} + Roem: ${escapedRoemWij} + Laatste slag: ${lastTrickWinner === 'wij' ? 10 : 0} + Pit: ${pitWijApplied ? 100 : 0} = <strong>${escapedScoreWij}</strong></div>
                </div>
                <div class="preview-team">
                    <strong>Team Zij:</strong>
                    <div>Kaarten: ${escapedCardPointsZij} + Roem: ${escapedRoemZij} + Laatste slag: ${lastTrickWinner === 'zij' ? 10 : 0} + Pit: ${pitZijApplied ? 100 : 0} = <strong>${escapedScoreZij}</strong></div>
                </div>
            </div>
        `;

        preview.style.display = 'block';
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

        if (this.isScoreLimitReached()) {
            const winner = this.getScoreLimitWinner();
            const winnerText = winner === 'tie' ? 'Gelijkspel' : `Team ${winner === 'wij' ? 'Wij' : 'Zij'}`;
            alert(`Het spel is al afgelopen. ${winnerText} heeft de grens van ${WINNING_SCORE} punten bereikt.`);
            return;
        }

        // Get input values
        const whoPlayed = document.getElementById('whoPlayed').value;
        const cardPointsWij = parseInt(document.getElementById('cardPointsWij').value) || 0;
        // Automatically calculate team zij points
        const cardPointsZij = CARD_POINTS_TOTAL - cardPointsWij;

        // Validate card points
        if (cardPointsWij < 0 || cardPointsWij > CARD_POINTS_TOTAL) {
            alert(`Kaartpunten voor Team Wij moeten tussen 0 en ${CARD_POINTS_TOTAL} liggen.`);
            return;
        }

        if (cardPointsWij === 0) {
            alert('Voer de kaartpunten voor Team Wij in.');
            return;
        }

        // Calculate roem for both teams
        const roemWij = this.calculateRoem('wij');
        const roemZij = this.calculateRoem('zij');

        // Get bonuses
        const lastTrickWinner = document.getElementById('lastTrickWinner').value;
        const pitWij = document.getElementById('pitWij').checked;
        const pitZij = document.getElementById('pitZij').checked;
        const autoPitWij = cardPointsWij === CARD_POINTS_TOTAL && cardPointsZij === 0;
        const autoPitZij = cardPointsZij === CARD_POINTS_TOTAL && cardPointsWij === 0;
        const pitWijApplied = pitWij || autoPitWij;
        const pitZijApplied = pitZij || autoPitZij;

        // Calculate base scores (card points + roem)
        let scoreWij = cardPointsWij + roemWij;
        let scoreZij = cardPointsZij + roemZij;

        // Add last trick bonus
        if (lastTrickWinner === 'wij') {
            scoreWij += 10;
        } else if (lastTrickWinner === 'zij') {
            scoreZij += 10;
        }

        // Add pit bonus
        if (pitWijApplied) {
            scoreWij += 100;
        }
        if (pitZijApplied) {
            scoreZij += 100;
        }

        // NAT CHECK: If playing team has <= 81 slagpunten (kaartpunten + laatste slag), all points go to opponent
        let natApplied = false;
        if (whoPlayed && cardPointsWij + cardPointsZij === CARD_POINTS_TOTAL) {
            const playingTeamCardPoints = whoPlayed === 'wij' ? cardPointsWij : cardPointsZij;
            const playingTeamLastTrick = lastTrickWinner === whoPlayed ? 10 : 0;
            const playingTeamTrickPoints = playingTeamCardPoints + playingTeamLastTrick;
            if (playingTeamTrickPoints <= NAT_MAX_TRICK_POINTS) {
                // NAT: All points go to opponent
                natApplied = true;
                if (whoPlayed === 'wij') {
                    scoreZij = scoreWij + scoreZij;
                    scoreWij = 0;
                } else {
                    scoreWij = scoreWij + scoreZij;
                    scoreZij = 0;
                }
            }
        }

        // Create round object with detailed breakdown
        const round = {
            round: this.rounds.length + 1,
            whoPlayed: whoPlayed || null,
            breakdown: {
                wij: {
                    cardPoints: cardPointsWij,
                    roem: roemWij,
                    lastTrick: lastTrickWinner === 'wij' ? 10 : 0,
                    pit: pitWijApplied ? 100 : 0,
                    total: scoreWij
                },
                zij: {
                    cardPoints: cardPointsZij,
                    roem: roemZij,
                    lastTrick: lastTrickWinner === 'zij' ? 10 : 0,
                    pit: pitZijApplied ? 100 : 0,
                    total: scoreZij
                }
            },
            scores: { wij: scoreWij, zij: scoreZij },
            natApplied: natApplied,
            timestamp: new Date().toISOString()
        };
        
        // Bewaar status vóór toevoegen om alleen te reageren op het moment dat de grens wordt bereikt.
        const wasScoreLimitReached = this.isScoreLimitReached();
        this.rounds.push(round);
        
        // Clear input fields
        this.clearRoundForm();
        
        // Update scores for all players
        this.recalculateScores();
        
        // Save game state
        this.saveGameState();
        
        // Update UI
        this.updateGameSummary();
        this.renderRoundsList();
        this.updateAddRoundButton();
        
        // Show success message
        if (natApplied) {
            this.showMessage(`Ronde toegevoegd! ⚠️ NAT toegepast - ${whoPlayed === 'wij' ? 'Team Wij' : 'Team Zij'} had ≤ ${NAT_MAX_TRICK_POINTS} slagpunten!`, 'warning');
        } else {
            this.showRoundAddedMessage();
        }

        if (!wasScoreLimitReached && this.isScoreLimitReached()) {
            const winner = this.getScoreLimitWinner();
            if (winner === 'wij' || winner === 'zij') {
                const winnerName = `Team ${winner === 'wij' ? 'Wij' : 'Zij'}`;
                this.showMessage(`🏆 ${winnerName} heeft gewonnen met ${WINNING_SCORE}+ punten!`, 'success');
                this.showWinnerFireworks(winnerName);
            } else if (winner === 'tie') {
                this.showMessage(`🤝 Gelijkspel op ${WINNING_SCORE}+ punten!`, 'info');
            }
        }
    }

    calculateRoem(team) {
        const roemInput = document.getElementById(team === 'wij' ? 'roemWij' : 'roemZij');
        return parseInt(roemInput?.value) || 0;
    }

    adjustRoem(team, amount) {
        const roemInput = document.getElementById(team === 'wij' ? 'roemWij' : 'roemZij');
        if (!roemInput) return;

        const current = parseInt(roemInput.value) || 0;
        this.setRoemValue(team, current + amount);
        this.updateScorePreview();
    }

    setRoemValue(team, value) {
        const roemInputId = team === 'wij' ? 'roemWij' : 'roemZij';
        const roemTotalId = team === 'wij' ? 'roemWijTotal' : 'roemZijTotal';
        const roemInput = document.getElementById(roemInputId);
        const roemTotal = document.getElementById(roemTotalId);
        const sanitizedValue = Math.max(0, parseInt(value) || 0);

        if (roemInput) {
            roemInput.value = sanitizedValue;
        }
        if (roemTotal) {
            roemTotal.textContent = sanitizedValue;
        }
    }

    clearRoundForm() {
        document.getElementById('whoPlayed').value = '';
        document.getElementById('cardPointsWij').value = '';
        document.getElementById('cardPointsZij').value = '';
        document.getElementById('lastTrickWinner').value = '';
        document.getElementById('pitWij').checked = false;
        document.getElementById('pitZij').checked = false;
        
        this.setRoemValue('wij', 0);
        this.setRoemValue('zij', 0);

        // Hide preview
        document.getElementById('scorePreview').style.display = 'none';
    }

    renumberRounds() {
        this.rounds.forEach((round, index) => {
            round.round = index + 1;
        });
    }

    removeRound(roundIndex) {
        if (confirm(`Weet je zeker dat je ronde ${roundIndex + 1} wilt verwijderen?`)) {
            this.rounds.splice(roundIndex, 1);
            this.renumberRounds();
            this.recalculateScores();
            this.saveGameState();
            this.updateGameSummary();
            this.renderRoundsList();
            this.updateAddRoundButton();
            this.showMessage('Ronde verwijderd!', 'success');
        }
    }

    loadRoundForReplay(roundIndex, message) {
        const round = this.rounds[roundIndex];
        if (!round) return;

        // Fill form with round data
        document.getElementById('whoPlayed').value = round.whoPlayed || '';
        
        if (round.breakdown) {
            document.getElementById('cardPointsWij').value = round.breakdown.wij.cardPoints || '';
            document.getElementById('cardPointsZij').value = round.breakdown.zij.cardPoints || '';
            
            // Set roem values
            const roemWij = round.breakdown.wij.roem || 0;
            const roemZij = round.breakdown.zij.roem || 0;
            
            this.setRoemValue('wij', roemWij);
            this.setRoemValue('zij', roemZij);
            
            // Set bonuses
            if (round.breakdown.wij.lastTrick > 0) {
                document.getElementById('lastTrickWinner').value = 'wij';
            } else if (round.breakdown.zij.lastTrick > 0) {
                document.getElementById('lastTrickWinner').value = 'zij';
            }
            
            document.getElementById('pitWij').checked = round.breakdown.wij.pit > 0;
            document.getElementById('pitZij').checked = round.breakdown.zij.pit > 0;
        } else {
            // Legacy format - try to extract from scores
            document.getElementById('cardPointsWij').value = round.scores.wij || '';
            document.getElementById('cardPointsZij').value = round.scores.zij || '';
        }

        // Remove the round (will be re-added when form is submitted)
        this.rounds.splice(roundIndex, 1);
        this.renumberRounds();
        this.recalculateScores();
        this.saveGameState();
        this.updateGameSummary();
        this.renderRoundsList();
        this.updateAddRoundButton();

        // Scroll to form
        document.querySelector('.round-input').scrollIntoView({ behavior: 'smooth' });
        this.showMessage(message, 'info');
    }

    editRound(roundIndex) {
        this.loadRoundForReplay(roundIndex, 'Ronde geladen voor bewerking. Pas aan en klik op "Ronde Toevoegen".');
    }

    replayRound(roundIndex) {
        const round = this.rounds[roundIndex];
        if (!round) return;

        if (confirm(`Ronde ${round.round} opnieuw spelen? De huidige score van deze ronde wordt verwijderd.`)) {
            this.loadRoundForReplay(roundIndex, 'Ronde klaar om opnieuw te spelen. Pas aan en klik op "Ronde Toevoegen".');
        }
    }

    renderRoundsList() {
        const container = document.getElementById('roundsList');
        const content = document.getElementById('roundsListContent');

        if (this.rounds.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        content.innerHTML = this.rounds.map((round, index) => {
            const breakdown = round.breakdown || {
                wij: { cardPoints: round.scores.wij || 0, roem: 0, lastTrick: 0, pit: 0, total: round.scores.wij || 0 },
                zij: { cardPoints: round.scores.zij || 0, roem: 0, lastTrick: 0, pit: 0, total: round.scores.zij || 0 }
            };

            const wijBreakdown = breakdown.wij;
            const zijBreakdown = breakdown.zij;
            const escapedRoundNum = escapeHtml(round.round);
            const escapedNatWarning = round.natApplied ? '⚠️ NAT' : '';
            const escapedWijScore = escapeHtml(round.scores.wij);
            const escapedZijScore = escapeHtml(round.scores.zij);

            return `
                <div class="round-item ${round.natApplied ? 'nat-applied' : ''}">
                    <div class="round-header">
                        <h4>Ronde ${escapedRoundNum} ${escapedNatWarning}</h4>
                        <div class="round-actions">
                            <button class="btn btn-small btn-primary" data-round-action="replay" data-round-index="${index}">Overspelen</button>
                            <button class="btn btn-small btn-secondary" data-round-action="edit" data-round-index="${index}">Bewerken</button>
                            <button class="btn btn-small btn-danger" data-round-action="remove" data-round-index="${index}">Verwijderen</button>
                        </div>
                    </div>
                    <div class="round-details">
                        <div class="round-team-detail">
                            <strong>Team Wij:</strong>
                            <span>Kaarten: ${wijBreakdown.cardPoints}</span>
                            <span>Roem: ${wijBreakdown.roem}</span>
                            <span>Laatste slag: ${wijBreakdown.lastTrick}</span>
                            <span>Pit: ${wijBreakdown.pit}</span>
                            <strong>Totaal: ${escapedWijScore}</strong>
                        </div>
                        <div class="round-team-detail">
                            <strong>Team Zij:</strong>
                            <span>Kaarten: ${zijBreakdown.cardPoints}</span>
                            <span>Roem: ${zijBreakdown.roem}</span>
                            <span>Laatste slag: ${zijBreakdown.lastTrick}</span>
                            <span>Pit: ${zijBreakdown.pit}</span>
                            <strong>Totaal: ${escapedZijScore}</strong>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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
        this.renderTeams();
    }

    renderTeams() {
        this.renderTeam('wij');
        this.renderTeam('zij');
        this.updateAddRoundButton();
    }

    renderTeam(teamName) {
        const container = document.getElementById(`team${teamName.charAt(0).toUpperCase() + teamName.slice(1)}Players`);
        const players = this.players[teamName];
        const escapedTeamName = teamName === 'wij' ? 'Wij' : 'Zij';
        
        if (players.length === 0) {
            container.innerHTML = `
                <div class="team-players empty">
                    <p>Nog geen spelers in team ${escapedTeamName}</p>
                    <p class="team-requirement">Minimaal 2 spelers vereist</p>
                </div>
            `;
            return;
        }
        
        if (players.length < 2) {
            container.innerHTML = `
                <div class="team-players incomplete">
                    ${players.map(player => {
                        const escapedPlayerName = escapeHtml(player.name);
                        const escapedTotal = escapeHtml(player.total);
                        const escapedScores = player.scores.map(score => 
                            `<span class="score-chip ${score < 0 ? 'negative' : ''}">${escapeHtml(score)}</span>`
                        ).join('');
                        return `
                        <div class="player-card team-${teamName}">
                            <div class="player-header">
                                <div class="player-name">${escapedPlayerName}</div>
                                <div class="player-total">${escapedTotal}</div>
                            </div>
                            <div class="player-scores">
                                ${escapedScores}
                            </div>
                            <button class="btn btn-secondary" style="margin-top: 10px; width: 100%; font-size: 0.9rem;" 
                                    onclick="game.removePlayer('${escapedPlayerName.replace(/'/g, "\\'")}', '${teamName}')">
                                Verwijderen
                            </button>
                        </div>
                    `}).join('')}
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
                    ${players.map(player => {
                        const escapedPlayerName = escapeHtml(player.name);
                        const escapedTotal = escapeHtml(player.total);
                        const escapedScores = player.scores.map(score => 
                            `<span class="score-chip ${score < 0 ? 'negative' : ''}">${escapeHtml(score)}</span>`
                        ).join('');
                        return `
                        <div class="player-card team-${teamName}">
                            <div class="player-header">
                                <div class="player-name">${escapedPlayerName}</div>
                                <div class="player-total">${escapedTotal}</div>
                            </div>
                            <div class="player-scores">
                                ${escapedScores}
                            </div>
                            <button class="btn btn-secondary" style="margin-top: 10px; width: 100%; font-size: 0.9rem;" 
                                    onclick="game.removePlayer('${escapedPlayerName.replace(/'/g, "\\'")}', '${teamName}')">
                                Verwijderen
                            </button>
                        </div>
                    `}).join('')}
                    <div class="team-status error">
                        <p class="team-requirement error">${players.length}/2 spelers - TE VEEL SPELERS! Verwijder ${players.length - 2} speler(s)</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = players.map(player => {
            const escapedPlayerName = escapeHtml(player.name);
            const escapedTotal = escapeHtml(player.total);
            const escapedScores = player.scores.map(score => 
                `<span class="score-chip ${score < 0 ? 'negative' : ''}">${escapeHtml(score)}</span>`
            ).join('');
            return `
            <div class="player-card team-${teamName}">
                <div class="player-header">
                    <div class="player-name">${escapedPlayerName}</div>
                    <div class="player-total">${escapedTotal}</div>
                </div>
                <div class="player-scores">
                    ${escapedScores}
                </div>
                <button class="btn btn-secondary" style="margin-top: 10px; width: 100%; font-size: 0.9rem;" 
                        onclick="game.removePlayer('${escapedPlayerName.replace(/'/g, "\\'")}', '${teamName}')">
                    Verwijderen
                </button>
            </div>
        `}).join('');
    }

    updateAddRoundButton() {
        const addRoundBtn = document.getElementById('addRoundBtn');
        const wijPlayers = this.players.wij.length;
        const zijPlayers = this.players.zij.length;
        const winner = this.getScoreLimitWinner();
        
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
        } else if (winner) {
            addRoundBtn.disabled = true;
            if (winner === 'tie') {
                addRoundBtn.textContent = `Spel afgelopen (${WINNING_SCORE}+ punten)`;
            } else {
                addRoundBtn.textContent = `Spel afgelopen - Team ${winner === 'wij' ? 'Wij' : 'Zij'} wint`;
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
            this.updateTeamStand(0, 0);
            return;
        }
        
        summary.style.display = 'block';
        
        // Calculate team totals with breakdown
        const breakdown = this.calculateTotalBreakdown();
        const teamTotals = {
            wij: breakdown.wij.total,
            zij: breakdown.zij.total
        };
        
        // Update team stand bovenaan
        this.updateTeamStand(teamTotals.wij, teamTotals.zij);
        
        // Determine winner
        const winner = teamTotals.wij > teamTotals.zij ? 'wij' : 
                      teamTotals.zij > teamTotals.wij ? 'zij' : 'tie';
        
        const escapedWinnerMessage = winner === 'tie' ? 'Gelijkspel!' : `Team ${winner === 'wij' ? 'Wij' : 'Zij'} wint!`;
        const escapedWinnerEmoji = winner === 'tie' ? '🤝' : '🏐';
        
        content.innerHTML = `
            <div class="summary-row">
                <span>Rondes gespeeld:</span>
                <span>${escapeHtml(this.rounds.length)}</span>
            </div>
            <div class="summary-breakdown">
                <div class="breakdown-team ${winner === 'wij' ? 'winner' : ''}">
                    <strong>Team Wij:</strong>
                    <div class="breakdown-details">
                        <span>Kaarten: ${escapeHtml(breakdown.wij.cardPoints)}</span>
                        <span>Roem: ${escapeHtml(breakdown.wij.roem)}</span>
                        <span>Bonussen: ${escapeHtml(breakdown.wij.bonuses)}</span>
                    </div>
                    <div class="breakdown-total">Totaal: ${escapeHtml(teamTotals.wij)}</div>
                </div>
                <div class="breakdown-team ${winner === 'zij' ? 'winner' : ''}">
                    <strong>Team Zij:</strong>
                    <div class="breakdown-details">
                        <span>Kaarten: ${escapeHtml(breakdown.zij.cardPoints)}</span>
                        <span>Roem: ${escapeHtml(breakdown.zij.roem)}</span>
                        <span>Bonussen: ${escapeHtml(breakdown.zij.bonuses)}</span>
                    </div>
                    <div class="breakdown-total">Totaal: ${escapeHtml(teamTotals.zij)}</div>
                </div>
            </div>
            <div class="summary-row ${winner === 'tie' ? 'winner' : ''}">
                <span>${escapedWinnerMessage}</span>
                <span>${escapedWinnerEmoji}</span>
            </div>
        `;
    }

    calculateTotalBreakdown() {
        const breakdown = {
            wij: { cardPoints: 0, roem: 0, bonuses: 0, total: 0 },
            zij: { cardPoints: 0, roem: 0, bonuses: 0, total: 0 }
        };

        this.rounds.forEach(round => {
            const roundBreakdown = round.breakdown || {
                wij: { cardPoints: round.scores.wij || 0, roem: 0, lastTrick: 0, pit: 0, total: round.scores.wij || 0 },
                zij: { cardPoints: round.scores.zij || 0, roem: 0, lastTrick: 0, pit: 0, total: round.scores.zij || 0 }
            };

            breakdown.wij.cardPoints += roundBreakdown.wij.cardPoints || 0;
            breakdown.wij.roem += roundBreakdown.wij.roem || 0;
            breakdown.wij.bonuses += (roundBreakdown.wij.lastTrick || 0) + (roundBreakdown.wij.pit || 0);
            breakdown.wij.total += round.scores.wij || 0;

            breakdown.zij.cardPoints += roundBreakdown.zij.cardPoints || 0;
            breakdown.zij.roem += roundBreakdown.zij.roem || 0;
            breakdown.zij.bonuses += (roundBreakdown.zij.lastTrick || 0) + (roundBreakdown.zij.pit || 0);
            breakdown.zij.total += round.scores.zij || 0;
        });

        return breakdown;
    }
    
    updateTeamStand(wijTotal, zijTotal) {
        const wijElement = document.getElementById('teamWijTotal');
        const zijElement = document.getElementById('teamZijTotal');
        
        if (wijElement && zijElement) {
            wijElement.textContent = wijTotal;
            zijElement.textContent = zijTotal;
        }
    }

    isScoreLimitReached() {
        const totals = this.calculateTeamTotals();
        return totals.wij >= WINNING_SCORE || totals.zij >= WINNING_SCORE;
    }

    getScoreLimitWinner() {
        const totals = this.calculateTeamTotals();
        if (totals.wij < WINNING_SCORE && totals.zij < WINNING_SCORE) {
            return null;
        }
        if (totals.wij === totals.zij) {
            return 'tie';
        }
        return totals.wij > totals.zij ? 'wij' : 'zij';
    }

    showWinnerFireworks(winnerName) {
        const overlay = document.createElement('div');
        overlay.className = 'fireworks-overlay';
        overlay.innerHTML = `
            <div class="fireworks-winner-name">🏆 ${escapeHtml(winnerName)} wint!</div>
            <div class="fireworks-container"></div>
        `;

        const container = overlay.querySelector('.fireworks-container');
        const colors = ['#ff4d4d', '#ffd93d', '#6bcB77', '#4d96ff', '#ff6f91', '#ffa94d'];
        for (let i = 0; i < 22; i++) {
            const firework = document.createElement('span');
            firework.className = 'firework-burst';
            firework.style.left = `${Math.random() * 100}%`;
            firework.style.top = `${Math.random() * 100}%`;
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.animationDelay = `${Math.random() * 0.9}s`;
            firework.style.animationDuration = `${1 + Math.random() * 0.9}s`;
            container.appendChild(firework);
        }

        document.body.appendChild(overlay);
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 3200);
    }

    async newGame() {
        // Save current game to database if there are rounds
        if (this.rounds.length > 0) {
            await this.saveGameToDatabase();
        }
        
        this.players = { wij: [], zij: [] };
        this.rounds = [];
        this.startTime = new Date().toISOString();
        this.gameStarted = false;
        
        // Hide main UI and show setup modal
        document.getElementById('mainGameUI').style.display = 'none';
        document.getElementById('gameSetupModal').style.display = 'block';
        
        // Clear setup form
        document.getElementById('playerWij1').value = '';
        document.getElementById('playerWij2').value = '';
        document.getElementById('playerZij1').value = '';
        document.getElementById('playerZij2').value = '';
        
        // Focus first input
        document.getElementById('playerWij1').focus();
        
        this.saveGameState();
    }

    checkGameState() {
        const wijPlayers = this.players.wij.length;
        const zijPlayers = this.players.zij.length;
        
        if (wijPlayers === 2 && zijPlayers === 2) {
            this.gameStarted = true;
            document.getElementById('mainGameUI').style.display = 'block';
            document.getElementById('gameSetupModal').style.display = 'none';
        } else {
            this.gameStarted = false;
            document.getElementById('mainGameUI').style.display = 'none';
            document.getElementById('gameSetupModal').style.display = 'block';
        }
    }

    startGameFromSetup() {
        const playerWij1 = document.getElementById('playerWij1').value.trim();
        const playerWij2 = document.getElementById('playerWij2').value.trim();
        const playerZij1 = document.getElementById('playerZij1').value.trim();
        const playerZij2 = document.getElementById('playerZij2').value.trim();
        
        // Validate all names are filled
        if (!playerWij1 || !playerWij2 || !playerZij1 || !playerZij2) {
            alert('Voer alle 4 spelersnamen in voordat je het spel start.');
            return;
        }
        
        // Check for duplicate names
        const allNames = [playerWij1, playerWij2, playerZij1, playerZij2];
        const uniqueNames = [...new Set(allNames)];
        if (uniqueNames.length !== allNames.length) {
            alert('Elke speler moet een unieke naam hebben.');
            return;
        }
        
        // Add players
        this.players.wij = [
            { name: playerWij1, scores: [], total: 0 },
            { name: playerWij2, scores: [], total: 0 }
        ];
        this.players.zij = [
            { name: playerZij1, scores: [], total: 0 },
            { name: playerZij2, scores: [], total: 0 }
        ];
        
        this.gameStarted = true;
        
        // Hide setup modal and show main UI
        document.getElementById('gameSetupModal').style.display = 'none';
        document.getElementById('mainGameUI').style.display = 'block';
        
        // Update UI
        this.renderTeams();
        this.updateAddRoundButton();
        this.updateGameSummary();
        this.updateTeamStand(0, 0);
        this.saveGameState();
        
        this.showMessage('Spel gestart! Je kunt nu beginnen met het invoeren van scores.', 'success');
    }

    cancelSetup() {
        // If there are existing players, keep them
        if (this.players.wij.length === 2 && this.players.zij.length === 2) {
            document.getElementById('gameSetupModal').style.display = 'none';
            document.getElementById('mainGameUI').style.display = 'block';
        } else {
            // If no players, show message
            alert('Je moet minimaal 4 spelers toevoegen om te kunnen spelen.');
        }
    }

    getNextSetupInput(currentId) {
        const order = ['playerWij1', 'playerWij2', 'playerZij1', 'playerZij2'];
        const currentIndex = order.indexOf(currentId);
        return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
    }

    setupAutoCalculate() {
        const cardPointsWij = document.getElementById('cardPointsWij');
        if (cardPointsWij) {
            cardPointsWij.addEventListener('input', () => {
                const wijPoints = parseInt(cardPointsWij.value) || 0;
                const zijPoints = CARD_POINTS_TOTAL - wijPoints;
                const cardPointsZij = document.getElementById('cardPointsZij');
                const pitWijCheckbox = document.getElementById('pitWij');
                const pitZijCheckbox = document.getElementById('pitZij');
                if (cardPointsZij) {
                    cardPointsZij.value = zijPoints >= 0 && zijPoints <= CARD_POINTS_TOTAL ? zijPoints : '';
                    if (pitWijCheckbox && pitZijCheckbox) {
                        pitWijCheckbox.checked = wijPoints === CARD_POINTS_TOTAL && zijPoints === 0;
                        pitZijCheckbox.checked = zijPoints === CARD_POINTS_TOTAL && wijPoints === 0;
                    }
                    // Trigger preview update
                    this.updateScorePreview();
                }
            });
        }
    }

    showRoundAddedMessage() {
        this.showMessage('Ronde toegevoegd!', 'success');
    }

    showMessage(text, type = 'success') {
        const colors = {
            success: '#4CAF50',
            warning: '#ff9800',
            error: '#f44336',
            info: '#2196F3'
        };
        
        const message = document.createElement('div');
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.success};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 300);
        }, type === 'warning' ? 4000 : 2000);
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

                // Convert old round format to new format if needed
                this.rounds = this.rounds.map(round => {
                    if (!round.breakdown && round.scores) {
                        return {
                            ...round,
                            breakdown: {
                                wij: {
                                    cardPoints: round.scores.wij || 0,
                                    roem: 0,
                                    lastTrick: 0,
                                    pit: 0,
                                    total: round.scores.wij || 0
                                },
                                zij: {
                                    cardPoints: round.scores.zij || 0,
                                    roem: 0,
                                    lastTrick: 0,
                                    pit: 0,
                                    total: round.scores.zij || 0
                                }
                            },
                            natApplied: false
                        };
                    }
                    return round;
                });

                // Render rounds list after loading
                if (this.rounds.length > 0) {
                    this.renderRoundsList();
                }
                
                // Check if game should be started
                this.checkGameState();
            } catch (e) {
                console.error('Error loading game state:', e);
                this.players = { wij: [], zij: [] };
                this.rounds = [];
                this.currentRound = 1;
                this.gameStarted = false;
                this.checkGameState();
            }
        } else {
            // No saved game, show setup
            this.checkGameState();
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

            // Get credentials from localStorage (set by user in admin section)
            const credentials = localStorage.getItem('serverCredentials');
            const headers = {
                'Content-Type': 'application/json',
            };
            
            if (credentials) {
                headers['Authorization'] = 'Basic ' + credentials;
            }

            const response = await fetch('/api/save-game', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(gameData)
            });

            if (response.status === 401) {
                console.error('Authentication required to save game');
                return false;
            }

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

    @keyframes fireworkBurst {
        0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 0;
        }
        20% {
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(2.4);
            opacity: 0;
        }
    }

    .fireworks-overlay {
        position: fixed;
        inset: 0;
        z-index: 1200;
        pointer-events: none;
        background: radial-gradient(circle, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.55));
    }

    .fireworks-container {
        position: absolute;
        inset: 0;
    }

    .firework-burst {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        animation-name: fireworkBurst;
        animation-timing-function: ease-out;
        animation-iteration-count: 2;
    }

    .fireworks-winner-name {
        position: absolute;
        top: 18%;
        left: 50%;
        transform: translateX(-50%);
        color: #fff;
        font-size: 2rem;
        font-weight: 700;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        text-align: center;
        padding: 8px 16px;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.35);
        max-width: calc(100% - 20px);
    }

    @media (max-width: 768px) {
        .fireworks-winner-name {
            font-size: 1.4rem;
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
