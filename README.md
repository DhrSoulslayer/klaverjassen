# Klaverjassen Score WebApp

Een mobiel-vriendelijke web applicatie om scores bij te houden voor het Nederlandse kaartspel Klaverjassen. Ondersteunt 2 teams ("Wij" vs "Zij") met maximaal 4 spelers.

## 🆕 Nieuwe Features

### 📊 Database & Admin Interface
- **Automatisch Opslaan**: Alle gespeelde spellen worden automatisch opgeslagen in een SQLite database
- **Admin Interface**: Bekijk alle gespeelde spellen en statistieken op `/admin`
- **Spelgeschiedenis**: Complete geschiedenis van alle spellen met scores, spelers en datums
- **Statistieken**: Overzicht van winst/verlies ratio's, gemiddelde scores en meest actieve spelers
- **Handmatig Opslaan**: "Spel Opslaan" knop om het huidige spel direct op te slaan

### 🔐 Beveiliging
- **Basic Authentication**: Admin interface beveiligd met wachtwoord
- **Security Headers**: Content-Security-Policy, X-Frame-Options, XSS-protection
- **Input Validatie**: Alle binnenkomende data wordt gevalideerd
- **Path Traversal Protection**: Voorkomt ongeautoriseerde bestandstoegang

## 🎯 Features

- **Team-gebaseerd Spel**: 2 vaste teams ("Wij" en "Zij")
- **Maximaal 4 Spelers**: Verdeeld over de 2 teams
- **Score Tracking**: Per ronde scores invoeren voor beide teams
- **Real-time Updates**: Scores worden direct bijgewerkt
- **Persistente Opslag**: Spelstatus wordt opgeslagen in localStorage
- **Database Opslag**: Alle voltooide spellen worden opgeslagen in SQLite database
- **Admin Dashboard**: Uitgebreide statistieken en spelgeschiedenis
- **Mobile-First Design**: Geoptimaliseerd voor mobiele apparaten en tablets
- **PWA Ondersteuning**: Installeerbaar als app op mobiele apparaten
- **Offline Functionaliteit**: Werkt ook zonder internetverbinding

## 🎮 Gebruik

### Spelers Toevoegen
1. Klik op "Speler Toevoegen"
2. Voer de naam van de speler in
3. Selecteer het team ("Wij" of "Zij")
4. Bevestig met "Toevoegen"

### Scores Invoeren
1. Voer de score in voor "Team Wij"
2. Voer de score in voor "Team Zij"
3. Klik op "Ronde Toevoegen"
4. Herhaal voor elke ronde

### Spel Opslaan
- **Automatisch**: Bij "Nieuw Spel" wordt het huidige spel automatisch opgeslagen
- **Handmatig**: Gebruik de "Spel Opslaan" knop om het huidige spel direct op te slaan

### Admin Interface
De admin interface biedt uitgebreide mogelijkheden:

**Toegang:**
- Ga naar `/admin` om de admin interface te openen
- Je wordt gevraagd om in te loggen met je admin credentials

**Functies:**
- **Statistieken**: Bekijk totaal aantal gespeelde spellen, overwinningen per team, gemiddelde scores
- **Spelgeschiedenis**: Doorzoek alle eerder gespeelde spellen met details
- **Filteren**: Bekijk specifieke periodes of teams

**Navigatie:**
- Klik op "Statistieken" voor een overzicht
- Klik op "Alle Spellen" voor de complete geschiedenis
- Klik op "Terug naar Spel" om terug te keren naar de hoofdapp

## 🚀 Installatie

### 🐳 Docker (Aanbevolen)

De applicatie kan eenvoudig worden gedraaid met Docker Desktop:

**Vereisten:**
- Docker Desktop geïnstalleerd
- Docker Compose geïnstalleerd

**Stappen:**

1. **Bouw en start de container:**
```bash
# In de project directory
docker-compose up -d
```

2. **Open de applicatie:**
- Hoofdapp: http://localhost:8000
- Admin interface: http://localhost:8000/admin

3. **Logs bekijken:**
```bash
docker-compose logs -f
```

4. **Container stoppen:**
```bash
docker-compose down
```

**Database persistentie:**
- De database wordt opgeslagen in de `data` directory
- Maak deze directory aan voordat je de container start:
```bash
mkdir data
```

**Netwerk toegang:**
- De app is toegankelijk via `http://localhost:8000`
- Binnen je lokale netwerk: `http://<jouw-ip-adres>:8000`

### Lokale Ontwikkeling (Zonder Docker)
```bash
# Clone de repository
git clone <repository-url>
cd klaverjassen

# Start de server met database functionaliteit
python3 server.py

# Open http://localhost:8000 in je browser
# Admin interface: http://localhost:8000/admin
```

### PWA Installatie
1. Open de app in Chrome/Safari op je mobiele apparaat
2. Klik op "Toevoegen aan startscherm" of "Install App"
3. De app wordt geïnstalleerd als een native app

## ⚙️ Configuratie

### Server Configuratie (server.py)

De server kan worden aangepast via de volgende opties:

```python
# Database
DB_FILE = 'klaverjassen_games.db'  # Naam van het database bestand

# Beveiliging
ADMIN_USERNAME = 'admin'  # Wijzig de admin gebruikersnaam
ADMIN_PASSWORD = 'wachtwoord'  # Wijzig het admin wachtwoord

# Toegestane bestandsextensies voor static files
ALLOWED_EXTENSIONS = {'.html', '.css', '.js', '.json', '.png', '.ico', '.svg'}
```

### Poort Wijzigen
Om de server op een andere poort te draaien, pas de `server_address` aan in de `main()` functie:
```python
server_address = ('', 8000)  # Wijzig 8000 naar gewenste poort
```

## 📁 Bestanden

- `server.py` - Python server met database functionaliteit en beveiliging
- `index.html` - Hoofdpagina van de webapp
- `styles.css` - Styling en responsive design
- `app.js` - Game logica en database integratie
- `manifest.json` - PWA configuratie
- `sw.js` - Service Worker voor offline functionaliteit
- `klaverjassen_games.db` - SQLite database (wordt automatisch aangemaakt)

## 🎨 Design Features

- **Responsive Design**: Werkt op alle schermformaten
- **Team Kleuren**: Groen voor "Wij", oranje voor "Zij"
- **Moderne UI**: Gradient achtergronden en schaduwen
- **Smooth Animaties**: Hover effecten en transities
- **Dark Mode Ready**: Ondersteunt systeem dark mode voorkeuren
- **Admin Dashboard**: Professionele interface voor statistieken

## 🔧 Technische Details

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Python HTTP server met SQLite database
- **Database**: SQLite met automatische schema creatie
- **API Endpoints**: `/api/save-game`, `/api/games`, `/api/stats`
- **Storage**: LocalStorage voor huidige spel + SQLite voor geschiedenis
- **PWA**: Service Worker, Manifest, offline caching
- **Beveiliging**: Basic Auth, Security Headers, Input Validatie

## 📱 Ondersteunde Apparaten

- **iOS**: iPhone, iPad (alle versies)
- **Android**: Alle moderne Android apparaten
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Tablets**: iPad, Android tablets, Windows tablets

## 🃏 Klaverjassen Specifiek

- **2 Teams**: Altijd "Wij" vs "Zij" (traditionele teamnamen)
- **Max 4 Spelers**: Verdeeld over de 2 teams
- **Team Scores**: Scores worden per team bijgehouden
- **Ronde-gebaseerd**: Elke ronde krijgt een score voor beide teams
- **Winnaar Bepaling**: Team met hoogste totale score wint

## 📊 Database Schema

De database slaat de volgende informatie op per spel:
- **Spel ID**: Unieke identifier
- **Datum & Tijd**: Wanneer het spel is gespeeld
- **Spelers**: Per team (Wij/Zij)
- **Rondes**: Alle ronde scores
- **Eindscore**: Totale scores per team
- **Winnaar**: Welk team heeft gewonnen
- **Duur**: Hoe lang het spel duurde (indien beschikbaar)

## 🌐 API Endpoints

| Endpoint | Methode | Beveiliging | Beschrijving |
|----------|---------|-------------|--------------|
| `/` | GET | Nee | Hoofdpagina |
| `/admin` | GET | Basic Auth | Admin interface |
| `/api/games` | GET | Basic Auth | Alle gespeelde spellen |
| `/api/stats` | GET | Nee | Spelstatistieken |
| `/api/save-game` | POST | Basic Auth | Spel opslaan in database |

## 🔐 Beveiliging

### Authenticatie
- **Basic Authentication**: De admin interface en sommige API endpoints zijn beveiligd met HTTP Basic Auth
- **Credentials**: Moeten worden geconfigureerd in `server.py`

### Security Features
- **Content-Security-Policy**: Beperkt welke brnen kunnen worden geladen
- **X-Frame-Options**: Voorkomt clickjacking aanvallen
- **X-Content-Type-Options**: Voorkomt MIME type sniffing
- **X-XSS-Protection**: XSS filter voor oudere browsers
- **Referrer Policy**: Controleert referrer informatie

### Input Validatie
- Alle binnenkomende data wordt gevalideerd op structuur
- Maximum payload grootte van 1MB
- SQL injection preventie via parameterized queries

## 🚨 Probleemoplossing

### Docker Problemen

**Container start niet:**
```bash
docker-compose logs
```

**Poort 8000 is al in gebruik:**
- Stop andere applicaties die poort 8000 gebruiken
- Of wijzig de poort in `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Wijzig naar gewenste poort
```

**Database niet persistent:**
- Zorg dat de `data` directory bestaat en schrijfbaar is
```bash
mkdir data
chmod 777 data
```

**Container bijwerken na code wijzigingen:**
```bash
docker-compose down
docker-compose up --build -d
```

### Algemeen

**Admin interface geeft 401 Unauthorized:**
- Controleer of de juiste credentials zijn ingesteld in `server.py`
- Start de server opnieuw na het wijzigen van credentials

**Database error:**
- Verwijder het oude `klaverjassen_games.db` bestand
- De server maakt automatisch een nieuwe database aan

**PWA werkt niet offline:**
- Controleer of de Service Worker correct is geregistreerd
- Zorg voor een HTTPS verbinding (of localhost)

## 📝 Licentie

Deze applicatie is open source en vrij te gebruiken.
