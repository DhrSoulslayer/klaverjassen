# 🃏 Klaverjassen Score WebApp

Een mobiel-vriendelijke web applicatie om scores bij te houden voor het Nederlandse kaartspel Klaverjassen. Speel met 2 teams ("Wij" vs "Zij"), houd alle rondes bij en bekijk de spelgeschiedenis via een beveiligd admin dashboard.

---

## 📋 Inhoudsopgave

1. [Hoe de app werkt](#-hoe-de-app-werkt)
2. [Installatie](#-installatie)
3. [Gebruik](#-gebruik)
4. [Admin Interface](#-admin-interface)
5. [Configuratie](#️-configuratie)
6. [Technische Details](#-technische-details)
7. [API Endpoints](#-api-endpoints)
8. [Beveiliging](#-beveiliging)
9. [Bestanden](#-bestanden)
10. [Probleemoplossing](#-probleemoplossing)

---

## 🎮 Hoe de app werkt

### Het spelverloop

De app volgt de standaard regels van Klaverjassen. Elk spel bestaat uit een reeks rondes. Per ronde voer je in:

- **Wie er heeft gespeeld** — Team Wij of Team Zij
- **Kaartpunten** van Team Wij (die van Team Zij worden automatisch berekend: 152 − wij)
- **Roem** — bonuspunten voor bijzondere combinaties in de hand:
  | Type | Punten |
  |------|--------|
  | Driekaart | 20 |
  | Vierkaart | 50 |
  | Stuk (heer + vrouw troef) | 20 |
  | Vier gelijken | 100 |
  | Vier boeren | 200 |
- **Laatste slag** — +10 punten voor het team dat de laatste slag pakt
- **Pit** — +100 punten als een team alle slagen pakt; wordt automatisch aangevinkt bij 152 kaartpunten

### NAT-regel

Als de spelende partij na de ronde **≤ 81 slagpunten** heeft (kaartpunten + eventuele +10 voor de laatste slag), gaan **alle punten** van die ronde naar de tegenstander. De app detecteert dit automatisch en toont een waarschuwing.

### Score en winnaar

De totaalscores worden per team opgebouwd over alle rondes. Het eerste team dat **1600 punten** bereikt wint het spel. Bij een gelijktijdige overschrijding is het gelijkspel.

### Opslaan

- De actuele spelstatus wordt continu opgeslagen in **localStorage** (ook na sluiten van de browser beschikbaar).
- Voltooide spellen worden opgeslagen in een **SQLite database** via de server (automatisch bij "Nieuw Spel", of handmatig via de knop "Spel Opslaan").

---

## 🚀 Installatie

### 🐳 Docker (Aanbevolen)

**Vereisten:** Docker geïnstalleerd

**1. Pull de image:**
```bash
docker pull ghcr.io/dhrsoulslayer/klaverjassen:latest
```

**2. Maak een data-directory aan voor de database:**
```bash
mkdir data
```

**3. Start de container:**
```bash
docker run -d \
  --name klaverjassen-app \
  -p 9876:9876 \
  -v "$(pwd)/data:/app/data" \
  --restart unless-stopped \
  ghcr.io/dhrsoulslayer/klaverjassen:latest
```

**4. Open de app:**
- Hoofdapp: http://localhost:9876
- Admin interface: http://localhost:9876/admin

**Handige commando's:**
```bash
# Logs bekijken
docker logs -f klaverjassen-app

# Container stoppen
docker stop klaverjassen-app && docker rm klaverjassen-app

# Updaten naar nieuwste versie
docker pull ghcr.io/dhrsoulslayer/klaverjassen:latest
docker stop klaverjassen-app && docker rm klaverjassen-app
docker run -d --name klaverjassen-app -p 9876:9876 -v "$(pwd)/data:/app/data" --restart unless-stopped ghcr.io/dhrsoulslayer/klaverjassen:latest
```

> **Netwerktoegang:** De app is ook bereikbaar via `http://<jouw-ip-adres>:9876` binnen je lokale netwerk.

---

### 💻 Lokale ontwikkeling (zonder Docker)

**Vereisten:** Python 3.10+

```bash
# Clone de repository
git clone <repository-url>
cd klaverjassen

# Start de server
python3 server.py

# Open http://localhost:9876 in je browser
```

---

### 📱 PWA installeren op je telefoon

1. Open http://localhost:9876 (of het serveradres) in Chrome of Safari
2. Kies **"Toevoegen aan startscherm"** / **"Install App"**
3. De app werkt daarna als een native app, inclusief offline

---

## 🕹️ Gebruik

### Een spel starten

Bij het openen van de app verschijnt het **startscherm**. Vul hier de namen in van de vier spelers (2 per team) en klik op **"Spel Starten"**.

### Een ronde invoeren

1. Kies wie er heeft gespeeld (Team Wij / Team Zij)
2. Voer de kaartpunten van Team Wij in — die van Team Zij worden automatisch ingevuld
3. Voer de roem in via de knoppen (+20, +50, +20, +100, +200) of voer direct een waarde in
4. Kies wie de laatste slag heeft gepakt (+10)
5. Vink pit aan indien van toepassing (+100)
6. Klik op **"Ronde Toevoegen"**

De **score preview** toont realtime de berekende scores voordat je opslaat, inclusief een waarschuwing als er een NAT van toepassing is.

### Rondes beheren

Elke ronde toont een uitklapbaar overzicht met kaartpunten, roem, bonussen en totaal per team. Via de knoppen per ronde kun je:

- **Bewerken** — laad de ronde terug in het formulier om aan te passen
- **Overspelen** — verwijder de ronde en vul opnieuw in
- **Verwijderen** — verwijder de ronde definitief

Alle teamscores worden na elke wijziging automatisch herberekend.

### Nieuw spel

Klik op **"Nieuw Spel"** om het huidige spel automatisch op te slaan in de database en een nieuw spel te starten.

---

## 🔑 Admin Interface

Ga naar `/admin` voor het beheerdersdashboard. Je hebt een gebruikersnaam en wachtwoord nodig (zie [Configuratie](#️-configuratie)).

### Statistieken

- Totaal aantal gespeelde spellen
- Overwinningen per team (Wij / Zij)
- Gemiddelde eindscores
- Meest actieve speler

### Spelgeschiedenis

Overzicht van alle gespeelde spellen met datum, spelers, scores en winnaar.

---

## ⚙️ Configuratie

De server wordt geconfigureerd bovenin `server.py`:

```python
# Database bestandsnaam
DB_FILE = 'klaverjassen_games.db'

# Admin inloggegevens — wijzig deze voor productiegebruik
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'klaverjassen2024'
```

**Poort wijzigen** — pas `server_address` aan in de `main()` functie:
```python
server_address = ('', 9876)  # vervang 9876 door de gewenste poort
```

---

## 🔧 Technische Details

| Onderdeel | Technologie |
|-----------|-------------|
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Backend | Python 3 (stdlib `http.server`) |
| Database | SQLite (automatisch aangemaakt) |
| Offline | Service Worker + localStorage |
| PWA | Web App Manifest + iOS meta-tags |
| Animaties | tsParticles (NAT-regen), GSAP (wiper), CSS (vuurwerk) |

### Spellogica (`app.js`)

- Alle score-berekeningen zitten in `addRound()` — dit is de _single source of truth_
- `recalculateScores()` herbouwt de spelerstotalen vanuit het `rounds`-array na elke wijziging
- Rondes worden opgeslagen met een volledig `breakdown`-object (kaartpunten, roem, bonussen) zodat er nooit herschakelende discrepanties optreden

### Datastructuur van een ronde

```json
{
  "round": 3,
  "whoPlayed": "wij",
  "breakdown": {
    "wij": { "cardPoints": 100, "roem": 20, "lastTrick": 10, "pit": 0, "total": 130 },
    "zij": { "cardPoints": 52,  "roem": 0,  "lastTrick": 0,  "pit": 0, "total": 52  }
  },
  "scores": { "wij": 130, "zij": 52 },
  "natApplied": false,
  "timestamp": "2026-05-25T14:00:00.000Z"
}
```

---

## 🌐 API Endpoints

| Endpoint | Methode | Beveiliging | Beschrijving |
|----------|---------|-------------|--------------|
| `/` | GET | — | Hoofdpagina |
| `/admin` | GET | 🔐 Basic Auth | Admin dashboard |
| `/api/games` | GET | 🔐 Basic Auth | Alle gespeelde spellen |
| `/api/stats` | GET | — | Spelstatistieken |
| `/api/save-game` | POST | 🔐 Basic Auth | Spel opslaan in database |

---

## 🔐 Beveiliging

- **Basic Authentication** op de admin interface en schrijf-endpoints
- **Content-Security-Policy** — beperkt te laden bronnen
- **X-Frame-Options: SAMEORIGIN** — voorkomt clickjacking
- **X-Content-Type-Options: nosniff** — voorkomt MIME-sniffing
- **X-XSS-Protection** — extra filter voor oudere browsers
- **Path traversal-bescherming** — bestandsnamen worden gesanitiseerd
- **Payload-limiet** — maximaal 1 MB per POST-verzoek
- **Parameterized queries** — voorkomt SQL-injectie

---

## 📁 Bestanden

| Bestand | Omschrijving |
|---------|--------------|
| `server.py` | Python HTTP-server met SQLite, API en admin interface |
| `index.html` | Hoofdpagina van de webapp |
| `styles.css` | Opmaak en responsive design |
| `app.js` | Game-logica, score-berekeningen en UI |
| `manifest.json` | PWA-configuratie |
| `sw.js` | Service Worker voor offline-caching |
| `tests/simulate_game.py` | Geautomatiseerde spelsimulatietests |
| `klaverjassen_games.db` | SQLite-database (automatisch aangemaakt) |

---

## 🚨 Probleemoplossing

**Container start niet:**
```bash
docker logs klaverjassen-app
```

**Poort 9876 al in gebruik:**
```bash
docker run -d --name klaverjassen-app -p 8080:9876 -v "$(pwd)/data:/app/data" ghcr.io/dhrsoulslayer/klaverjassen:latest
```

**Database niet persistent na herstarten:**
```bash
mkdir data && chmod 755 data
# Start de container opnieuw met de -v vlag zoals hierboven
```

**Admin interface geeft 401 Unauthorized:**
- Controleer de credentials in `server.py` en herstart de server

**Database corrupt of leeg:**
```bash
# Verwijder het bestand — de server maakt automatisch een nieuwe aan
rm klaverjassen_games.db
```

**PWA werkt niet offline:**
- Controleer of de Service Worker is geregistreerd (DevTools → Application → Service Workers)
- De app vereist HTTPS of `localhost` voor PWA-functionaliteit

---

## 📝 Licentie

Deze applicatie is open source en vrij te gebruiken.


