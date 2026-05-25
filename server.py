#!/usr/bin/env python3
"""
Klaverjassen Score Server with Database
Stores game results and provides admin interface
"""

import json
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import sqlite3
import re

# Database setup
DB_FILE = 'klaverjassen_games.db'

# Security: Admin credentials (change these for production)
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'klaverjassen2024'

# Security: Allowed file extensions for static files
ALLOWED_EXTENSIONS = {'.html', '.css', '.js', '.json', '.png', '.ico', '.svg'}

def init_database():
    """Initialize SQLite database with games table"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            team_wij TEXT NOT NULL,
            team_zij TEXT NOT NULL,
            players_wij TEXT NOT NULL,
            players_zij TEXT NOT NULL,
            rounds TEXT NOT NULL,
            final_score_wij INTEGER NOT NULL,
            final_score_zij INTEGER NOT NULL,
            winner TEXT NOT NULL,
            duration_minutes INTEGER
        )
    ''')
    
    conn.commit()
    conn.close()

def save_game(game_data):
    """Save a completed game to the database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Calculate duration if start_time is provided
    duration = None
    if 'start_time' in game_data:
        start_time = datetime.fromisoformat(game_data['start_time'])
        end_time = datetime.now()
        duration = int((end_time - start_time).total_seconds() / 60)
    
    cursor.execute('''
        INSERT INTO games (
            date, timestamp, team_wij, team_zij, players_wij, players_zij,
            rounds, final_score_wij, final_score_zij, winner, duration_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.now().strftime('%Y-%m-%d'),
        datetime.now().isoformat(),
        'Team Wij',
        'Team Zij',
        json.dumps(game_data['players']['wij']),
        json.dumps(game_data['players']['zij']),
        json.dumps(game_data['rounds']),
        game_data['teamTotals']['wij'],
        game_data['teamTotals']['zij'],
        game_data['winner'],
        duration
    ))
    
    game_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return game_id

def get_all_games():
    """Retrieve all games from database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, date, timestamp, team_wij, team_zij, players_wij, players_zij,
               rounds, final_score_wij, final_score_zij, winner, duration_minutes
        FROM games ORDER BY timestamp DESC
    ''')
    
    games = []
    for row in cursor.fetchall():
        games.append({
            'id': row[0],
            'date': row[1],
            'timestamp': row[2],
            'team_wij': row[3],
            'team_zij': row[4],
            'players_wij': json.loads(row[5]),
            'players_zij': json.loads(row[6]),
            'rounds': json.loads(row[7]),
            'final_score_wij': row[8],
            'final_score_zij': row[9],
            'winner': row[10],
            'duration_minutes': row[11]
        })
    
    conn.close()
    return games

def get_game_stats():
    """Get game statistics"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Total games
    cursor.execute('SELECT COUNT(*) FROM games')
    total_games = cursor.fetchone()[0]
    
    # Games won by each team
    cursor.execute('SELECT COUNT(*) FROM games WHERE winner = "Wij"')
    wij_wins = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM games WHERE winner = "Zij"')
    zij_wins = cursor.fetchone()[0]
    
    # Average scores
    cursor.execute('SELECT AVG(final_score_wij), AVG(final_score_zij) FROM games')
    avg_scores = cursor.fetchone()
    avg_wij = round(avg_scores[0], 1) if avg_scores[0] else 0
    avg_zij = round(avg_scores[1], 1) if avg_scores[1] else 0
    
    # Most active players
    cursor.execute('''
        SELECT players_wij, players_zij FROM games
    ''')
    
    player_counts = {}
    for row in cursor.fetchall():
        players_wij = json.loads(row[0])
        players_zij = json.loads(row[1])
        
        for player in players_wij + players_zij:
            player_counts[player] = player_counts.get(player, 0) + 1
    
    top_players = sorted(player_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    conn.close()
    
    return {
        'total_games': total_games,
        'wij_wins': wij_wins,
        'zij_wins': zij_wins,
        'avg_score_wij': avg_wij,
        'avg_score_zij': avg_zij,
        'top_players': top_players
    }

class KlaverjassenHandler(BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        """Custom logging to avoid console spam"""
        pass
    
    def _send_security_headers(self):
        """Send security headers with all responses"""
        # Content Security Policy - only allow same origin
        self.send_header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' https://cdn.jsdelivr.net/npm/tsparticles@4/tsparticles.bundle.min.js https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js")
        # Prevent clickjacking
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        # Prevent MIME type sniffing
        self.send_header('X-Content-Type-Options', 'nosniff')
        # XSS protection header for older browsers
        self.send_header('X-XSS-Protection', '1; mode=block')
        # Referrer policy
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    def _check_basic_auth(self):
        """Check basic authentication for admin endpoints"""
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Basic '):
            return False
        
        try:
            import base64
            credentials = base64.b64decode(auth_header[6:]).decode('utf-8')
            username, password = credentials.split(':', 1)
            return username == ADMIN_USERNAME and password == ADMIN_PASSWORD
        except Exception:
            return False
    
    def _send_auth_required(self):
        """Send 401 Unauthorized response"""
        self.send_response(401)
        self._send_security_headers()
        self.send_header('WWW-Authenticate', 'Basic realm="Admin Area"')
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Authentication required')
    
    def _validate_game_data(self, game_data):
        """Validate incoming game data structure"""
        errors = []
        
        # Check required fields
        if not isinstance(game_data, dict):
            errors.append('Game data must be an object')
            return errors
        
        # Validate players structure
        if 'players' not in game_data:
            errors.append('Missing players field')
        else:
            players = game_data['players']
            if not isinstance(players, dict):
                errors.append('Players must be an object')
            else:
                for team in ['wij', 'zij']:
                    if team not in players:
                        errors.append(f'Missing {team} team in players')
                    else:
                        if not isinstance(players[team], list):
                            errors.append(f'{team} players must be an array')
        
        # Validate rounds structure
        if 'rounds' not in game_data:
            errors.append('Missing rounds field')
        else:
            rounds = game_data['rounds']
            if not isinstance(rounds, list):
                errors.append('Rounds must be an array')
            else:
                for i, round_data in enumerate(rounds):
                    if not isinstance(round_data, dict):
                        errors.append(f'Round {i} must be an object')
                    elif 'scores' not in round_data:
                        errors.append(f'Round {i} missing scores')
        
        # Validate teamTotals
        if 'teamTotals' not in game_data:
            errors.append('Missing teamTotals field')
        else:
            totals = game_data['teamTotals']
            if not isinstance(totals, dict):
                errors.append('teamTotals must be an object')
            else:
                for team in ['wij', 'zij']:
                    if team not in totals:
                        errors.append(f'Missing {team} in teamTotals')
                    elif not isinstance(totals[team], (int, float)):
                        errors.append(f'{team} total must be a number')
        
        # Validate winner
        if 'winner' not in game_data:
            errors.append('Missing winner field')
        elif game_data['winner'] not in ['Wij', 'Zij', 'Gelijkspel']:
            errors.append('Invalid winner value')
        
        return errors
    
    def _sanitize_filename(self, filename):
        """Prevent path traversal by sanitizing filename"""
        # Remove any path components
        filename = os.path.basename(filename)
        # Only allow alphanumeric, underscore, hyphen, and dot
        filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '', filename)
        # Prevent null bytes
        filename = filename.replace('\x00', '')
        return filename
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/':
            self.serve_file('index.html', 'text/html')
        elif path == '/admin':
            # Require authentication for admin interface
            if not self._check_basic_auth():
                self._send_auth_required()
                return
            self.serve_admin_interface()
        elif path == '/api/games':
            # Require authentication for API
            if not self._check_basic_auth():
                self._send_auth_required()
                return
            self.serve_api_games()
        elif path == '/api/stats':
            self.serve_api_stats()
        elif path.endswith('.css'):
            safe_filename = self._sanitize_filename(path[1:])
            self.serve_file(safe_filename, 'text/css')
        elif path.endswith('.js'):
            safe_filename = self._sanitize_filename(path[1:])
            self.serve_file(safe_filename, 'application/javascript')
        elif path.endswith('.json'):
            safe_filename = self._sanitize_filename(path[1:])
            self.serve_file(safe_filename, 'application/json')
        else:
            safe_filename = self._sanitize_filename(path[1:])
            self.serve_file(safe_filename, 'text/html')
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/save-game':
            self.handle_save_game()
        else:
            self.send_error(404)
    
    def serve_file(self, filename, content_type):
        """Serve a static file with security headers"""
        # Additional path validation - ensure file exists and is within allowed directory
        if not filename or '..' in filename or filename.startswith('/'):
            self.send_error(403)
            return
        
        # Check if file extension is allowed
        _, ext = os.path.splitext(filename)
        if ext.lower() not in ALLOWED_EXTENSIONS:
            self.send_error(403)
            return
        
        try:
            with open(filename, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self._send_security_headers()
            # Only allow CORS for API endpoints, not static files
            # self.send_header('Access-Control-Allow-Origin', '*')  # Removed for security
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404)
    
    def serve_admin_interface(self):
        """Serve the admin interface HTML"""
        # Double-check authentication
        if not self._check_basic_auth():
            self._send_auth_required()
            return
        
        # Get the Authorization header to pass to the admin page
        auth_header = self.headers.get('Authorization', '')
        
        html = self.generate_admin_html()
        
        # Inject credentials into the page for API calls
        if auth_header.startswith('Basic '):
            # Store credentials in sessionStorage via inline script
            credential_script = f'<script>sessionStorage.setItem("adminCredentials", "{auth_header[6:]}");</script>'
            html = html.replace('</head>', credential_script + '</head>')
        
        encoded = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded)))
        # Admin page uses inline <script> blocks, so 'unsafe-inline' is required here.
        # The remaining security headers match _send_security_headers().
        self.send_header('Content-Security-Policy',
                         "default-src 'self'; style-src 'self' 'unsafe-inline'; "
                         "script-src 'self' 'unsafe-inline'")
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.end_headers()
        self.wfile.write(encoded)
    
    def generate_admin_html(self):
        """Generate the admin interface HTML"""
        return '''<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Klaverjassen Admin - Spelgeschiedenis</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .nav {
            background: #ecf0f1;
            padding: 20px;
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        
        .nav-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .nav-btn:hover {
            background: #2980b9;
            transform: translateY(-2px);
        }
        
        .nav-btn.active {
            background: #27ae60;
        }
        
        .content {
            padding: 30px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-size: 1rem;
            opacity: 0.9;
        }
        
        .games-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .games-table th {
            background: #34495e;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .games-table td {
            padding: 15px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .games-table tr:hover {
            background: #f8f9fa;
        }
        
        .winner-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
        }
        
        .winner-wij {
            background: #27ae60;
            color: white;
        }
        
        .winner-zij {
            background: #e74c3c;
            color: white;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            font-size: 1.2rem;
            color: #7f8c8d;
        }
        
        .no-games {
            text-align: center;
            padding: 40px;
            color: #7f8c8d;
        }
        
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .games-table {
                font-size: 0.9rem;
            }
            
            .games-table th,
            .games-table td {
                padding: 10px 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 Klaverjassen Admin</h1>
            <p>Spelgeschiedenis en Statistieken</p>
        </div>
        
        <div class="nav">
            <button class="nav-btn active" onclick="showStats()">Statistieken</button>
            <button class="nav-btn" onclick="showGames()">Alle Spellen</button>
            <a href="/" class="nav-btn" style="text-decoration: none; display: inline-block;">Terug naar Spel</a>
        </div>
        
        <div class="content">
            <div id="stats-section">
                <div class="stats-grid" id="stats-grid">
                    <div class="loading">Laden...</div>
                </div>
            </div>
            
            <div id="games-section" style="display: none;">
                <h2 style="margin-bottom: 20px; color: #2c3e50;">Alle Gespeelde Spellen</h2>
                <div id="games-table-container">
                    <div class="loading">Laden...</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Get credentials from session storage (set by server on admin page load)
        const adminCredentials = sessionStorage.getItem('adminCredentials');
        
        function getAuthHeader() {
            const creds = sessionStorage.getItem('adminCredentials');
            if (!creds) return {};
            return { 'Authorization': 'Basic ' + creds };
        }
        
        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            if (text === null || text === undefined) return '';
            const div = document.createElement('div');
            div.textContent = String(text);
            return div.innerHTML;
        }
        
        // Load stats on page load
        document.addEventListener('DOMContentLoaded', loadStats);
        
        function showStats() {
            document.getElementById('stats-section').style.display = 'block';
            document.getElementById('games-section').style.display = 'none';
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        }
        
        function showGames() {
            document.getElementById('stats-section').style.display = 'none';
            document.getElementById('games-section').style.display = 'block';
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            loadGames();
        }
        
        async function loadStats() {
            try {
                const response = await fetch('/api/stats', {
                    headers: getAuthHeader()
                });
                if (response.status === 401) {
                    window.location.href = '/admin';
                    return;
                }
                const stats = await response.json();
                displayStats(stats);
            } catch (error) {
                console.error('Error loading stats:', error);
                document.getElementById('stats-grid').innerHTML = '<div class="no-games">Fout bij laden van statistieken</div>';
            }
        }
        
        function displayStats(stats) {
            const statsGrid = document.getElementById('stats-grid');
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${escapeHtml(stats.total_games)}</div>
                    <div class="stat-label">Totaal Spellen</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${escapeHtml(stats.wij_wins)}</div>
                    <div class="stat-label">Team Wij Wint</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${escapeHtml(stats.zij_wins)}</div>
                    <div class="stat-label">Team Zij Wint</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${escapeHtml(stats.avg_score_wij)}</div>
                    <div class="stat-label">Gem. Score Wij</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${escapeHtml(stats.avg_score_zij)}</div>
                    <div class="stat-label">Gem. Score Zij</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${escapeHtml(stats.top_players[0] ? stats.top_players[0][1] : 0)}</div>
                    <div class="stat-label">Meest Actief</div>
                </div>
            `;
        }
        
        async function loadGames() {
            try {
                const response = await fetch('/api/games', {
                    headers: getAuthHeader()
                });
                if (response.status === 401) {
                    window.location.href = '/admin';
                    return;
                }
                const games = await response.json();
                displayGames(games);
            } catch (error) {
                console.error('Error loading games:', error);
                document.getElementById('games-table-container').innerHTML = '<div class="no-games">Fout bij laden van spellen</div>';
            }
        }
        
        function displayGames(games) {
            const container = document.getElementById('games-table-container');
            
            if (games.length === 0) {
                container.innerHTML = '<div class="no-games">Nog geen spellen gespeeld</div>';
                return;
            }
            
            const table = `
                <table class="games-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Spelers Wij</th>
                            <th>Spelers Zij</th>
                            <th>Score Wij</th>
                            <th>Score Zij</th>
                            <th>Winnaar</th>
                            <th>Rondes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${games.map(game => `
                            <tr>
                                <td>${escapeHtml(formatDate(game.date))}</td>
                                <td>${escapeHtml(game.players_wij.join(', '))}</td>
                                <td>${escapeHtml(game.players_zij.join(', '))}</td>
                                <td><strong>${escapeHtml(game.final_score_wij)}</strong></td>
                                <td><strong>${escapeHtml(game.final_score_zij)}</strong></td>
                                <td>
                                    <span class="winner-badge ${game.winner === 'Wij' ? 'winner-wij' : 'winner-zij'}">
                                        ${escapeHtml(game.winner)}
                                    </span>
                                </td>
                                <td>${escapeHtml(game.rounds.length)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            container.innerHTML = table;
        }
        
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    </script>
</body>
</html>'''
    
    def serve_api_games(self):
        """Serve games API endpoint"""
        # Double-check authentication
        if not self._check_basic_auth():
            self._send_auth_required()
            return
        
        games = get_all_games()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self._send_security_headers()
        self.send_header('Access-Control-Allow-Origin', self.headers.get('Origin', '*'))
        self.end_headers()
        self.wfile.write(json.dumps(games).encode('utf-8'))
    
    def serve_api_stats(self):
        """Serve stats API endpoint"""
        stats = get_game_stats()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self._send_security_headers()
        self.send_header('Access-Control-Allow-Origin', self.headers.get('Origin', '*'))
        self.end_headers()
        self.wfile.write(json.dumps(stats).encode('utf-8'))
    
    def handle_save_game(self):
        """Handle saving a completed game with authentication and validation"""
        # Check authentication
        if not self._check_basic_auth():
            self._send_auth_required()
            return
        
        # Check Content-Length to prevent large payload attacks
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 1024 * 1024:  # 1MB limit
            self.send_error(413)  # Payload Too Large
            return
        
        post_data = self.rfile.read(content_length)
        
        try:
            game_data = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            response = {'success': False, 'error': 'Invalid JSON data'}
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self._send_security_headers()
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
        
        # Validate game data structure
        validation_errors = self._validate_game_data(game_data)
        if validation_errors:
            response = {'success': False, 'error': 'Validation failed', 'details': validation_errors}
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self._send_security_headers()
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
        
        try:
            game_id = save_game(game_data)
            response = {'success': True, 'game_id': game_id}
        except Exception as e:
            response = {'success': False, 'error': str(e)}
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self._send_security_headers()
        self.send_header('Access-Control-Allow-Origin', self.headers.get('Origin', '*'))
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))

def main():
    """Main function to start the server"""
    print("🚀 Starting Klaverjassen Score Server...")
    
    # Initialize database
    init_database()
    print(f"✅ Database initialized: {DB_FILE}")
    
    # Start server
    server_address = ('', 9876)
    httpd = HTTPServer(server_address, KlaverjassenHandler)
    
    print("🌐 Server running at http://localhost:9876")
    print("📊 Admin interface: http://localhost:9876/admin")
    print("📱 Main app: http://localhost:9876")
    print("⏹️  Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    main()
