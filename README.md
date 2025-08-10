# Klaverjassen Score WebApp

Een mobiel-vriendelijke web applicatie om scores bij te houden voor het Nederlandse kaartspel Klaverjassen. Ondersteunt 2 teams ("Wij" vs "Zij") met maximaal 4 spelers.

## 🆕 Nieuwe Features

### 📊 Database & Admin Interface
- **Automatisch Opslaan**: Alle gespeelde spellen worden automatisch opgeslagen in een SQLite database
- **Admin Interface**: Bekijk alle gespeelde spellen en statistieken op `/admin`
- **Spelgeschiedenis**: Complete geschiedenis van alle spellen met scores, spelers en datums
- **Statistieken**: Overzicht van winst/verlies ratio's, gemiddelde scores en meest actieve spelers
- **Handmatig Opslaan**: "Spel Opslaan" knop om het huidige spel direct op te slaan

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
- Ga naar `/admin` om alle gespeelde spellen te bekijken
- Bekijk statistieken en spelgeschiedenis
- Navigeer tussen statistieken en alle spellen

## 🚀 Installatie

### Lokale Ontwikkeling
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

## 📁 Bestanden

- `server.py` - Python server met database functionaliteit
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

## 🔮 Toekomstige Features

- [ ] Export functionaliteit (PDF, Excel)
- [ ] Spelers statistieken per team
- [ ] Rondes per speler bijhouden
- [ ] Tijdsduur per spel
- [ ] Backup/restore functionaliteit
- [ ] Multi-language ondersteuning
- [ ] Thema's en customisatie
- [ ] Real-time multiplayer scores
- [ ] Notificaties bij belangrijke momenten
- [ ] Spel templates en presets

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

- `GET /` - Hoofdpagina
- `GET /admin` - Admin interface
- `GET /api/games` - Alle gespeelde spellen
- `GET /api/stats` - Spelstatistieken
- `POST /api/save-game` - Spel opslaan in database

## 🔐 Beveiliging

- **Lokale Database**: Alle data wordt lokaal opgeslagen
- **Geen Externe Dependencies**: Werkt volledig offline
- **Geen Persoonlijke Data**: Alleen spel scores worden opgeslagen
- **Lokale Server**: Geen externe servers of API's nodig
