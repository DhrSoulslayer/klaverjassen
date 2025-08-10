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

# Database setup
DB_FILE = 'klaverjassen_games.db'

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
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/':
            self.serve_file('index.html', 'text/html')
        elif path == '/admin':
            self.serve_admin_interface()
        elif path == '/api/games':
            self.serve_api_games()
        elif path == '/api/stats':
            self.serve_api_stats()
        elif path.endswith('.css'):
            self.serve_file(path[1:], 'text/css')
        elif path.endswith('.js'):
            self.serve_file(path[1:], 'application/javascript')
        elif path.endswith('.json'):
            self.serve_file(path[1:], 'application/json')
        else:
            self.serve_file(path[1:], 'text/html')
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/save-game':
            self.handle_save_game()
        else:
            self.send_error(404)
    
    def serve_file(self, filename, content_type):
        """Serve a static file"""
        try:
            with open(filename, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404)
    
    def serve_admin_interface(self):
        """Serve the admin interface HTML"""
        html = self.generate_admin_html()
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(html.encode('utf-8'))))
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def generate_admin_html(self):
        """Generate the admin interface HTML"""
        return '''<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Klaverjassen Admin - Spelgeschiedenis</title>
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
                const response = await fetch('/api/stats');
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
                    <div class="stat-number">${stats.total_games}</div>
                    <div class="stat-label">Totaal Spellen</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.wij_wins}</div>
                    <div class="stat-label">Team Wij Wint</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.zij_wins}</div>
                    <div class="stat-label">Team Zij Wint</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.avg_score_wij}</div>
                    <div class="stat-label">Gem. Score Wij</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.avg_score_zij}</div>
                    <div class="stat-label">Gem. Score Zij</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.top_players[0] ? stats.top_players[0][1] : 0}</div>
                    <div class="stat-label">Meest Actief</div>
                </div>
            `;
        }
        
        async function loadGames() {
            try {
                const response = await fetch('/api/games');
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
                                <td>${formatDate(game.date)}</td>
                                <td>${game.players_wij.join(', ')}</td>
                                <td>${game.players_zij.join(', ')}</td>
                                <td><strong>${game.final_score_wij}</strong></td>
                                <td><strong>${game.final_score_zij}</strong></td>
                                <td>
                                    <span class="winner-badge ${game.winner === 'Wij' ? 'winner-wij' : 'winner-zij'}">
                                        ${game.winner}
                                    </span>
                                </td>
                                <td>${game.rounds.length}</td>
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
        games = get_all_games()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(games).encode('utf-8'))
    
    def serve_api_stats(self):
        """Serve stats API endpoint"""
        stats = get_game_stats()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(stats).encode('utf-8'))
    
    def handle_save_game(self):
        """Handle saving a completed game"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        game_data = json.loads(post_data.decode('utf-8'))
        
        try:
            game_id = save_game(game_data)
            response = {'success': True, 'game_id': game_id}
        except Exception as e:
            response = {'success': False, 'error': str(e)}
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Custom logging to avoid console spam"""
        pass

def main():
    """Main function to start the server"""
    print("🚀 Starting Klaverjassen Score Server...")
    
    # Initialize database
    init_database()
    print(f"✅ Database initialized: {DB_FILE}")
    
    # Start server
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, KlaverjassenHandler)
    
    print("🌐 Server running at http://localhost:8000")
    print("📊 Admin interface: http://localhost:8000/admin")
    print("📱 Main app: http://localhost:8000")
    print("⏹️  Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    main()
