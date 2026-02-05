# 📋 LIJST VAN WIJZIGINGEN VOOR KLVERJASSEN REGELS

## ⚠️ BELANGRIJK: Geef akkoord voor elke wijziging die je wilt doorvoeren

---

## 🔴 HOOG PRIORITEIT (Kritiek voor correcte puntentelling)

### 1. Laatste Slag Bonus (+10 punten)
**Wat ontbreekt:**
- Geen tracking wie de laatste slag wint
- Geen automatische +10 punten bonus

**Wijziging nodig:**
- [ ] Toevoegen dropdown/radio buttons: "Wie won de laatste slag?" (Team Wij / Team Zij)
- [ ] Automatisch +10 punten toevoegen aan winnend team
- [ ] Aanpassen `addRound()` functie om laatste slag bonus toe te voegen

**Bestanden te wijzigen:**
- `index.html` - Nieuwe UI element voor laatste slag
- `app.js` - Logica in `addRound()` functie

---

### 2. Roem Invoer (Bonus punten)
**Wat ontbreekt:**
- Geen invoer voor roem combinaties
- Geen berekening van roem punten

**Roem types:**
- Driekaart (3 op een rij): +20 punten
- Vierkaart (4 op een rij): +50 punten  
- Stuk (Heer + Vrouw troef): +20 punten
- Vier gelijken (4x10/Koning/Vrouw/Aas): +100 punten
- Vier boeren: +200 punten

**Wijziging nodig:**
- [ ] Toevoegen invoervelden voor roem per team per ronde
- [ ] Dropdown/checkboxes voor roem types
- [ ] Automatisch roem punten optellen bij totaal score
- [ ] Aanpassen `addRound()` functie

**Bestanden te wijzigen:**
- `index.html` - Nieuwe UI velden voor roem
- `app.js` - Logica in `addRound()` functie
- `styles.css` - Styling voor nieuwe velden

---

### 3. Nat Check (Kritieke regel)
**Wat ontbreekt:**
- Geen tracking wie "gegaan" is (wie speelt)
- Geen check of team < 82 kaartpunten haalt
- Geen automatische punten overdracht bij nat

**Regel:**
- Als spelend team < 82 kaartpunten haalt (zonder roem), gaan ALLE punten naar tegenstander

**Wijziging nodig:**
- [ ] Toevoegen dropdown: "Wie is gegaan?" (Team Wij / Team Zij)
- [ ] Invoerveld voor kaartpunten (zonder roem)
- [ ] Check in `addRound()`: als kaartpunten < 82 → verplaats alle punten naar tegenstander
- [ ] Waarschuwing tonen bij nat situatie

**Bestanden te wijzigen:**
- `index.html` - Nieuwe UI velden
- `app.js` - Nat check logica in `addRound()`
- `styles.css` - Styling

---

## 🟡 MEDIUM PRIORITEIT (Belangrijk voor volledigheid)

### 4. Pit (Mars) Bonus (+100 punten)
**Wat ontbreekt:**
- Geen detectie of team alle 8 slagen wint
- Geen automatische +100 punten bonus

**Wijziging nodig:**
- [ ] Toevoegen checkbox: "Pit (alle 8 slagen gewonnen)"
- [ ] Automatisch +100 punten toevoegen bij pit
- [ ] Aanpassen `addRound()` functie

**Bestanden te wijzigen:**
- `index.html` - Nieuwe checkbox
- `app.js` - Logica in `addRound()`

---

### 5. Score Validatie
**Wat ontbreekt:**
- Geen validatie dat kaartpunten optellen tot 162
- Geen waarschuwing bij ongeldige scores

**Wijziging nodig:**
- [ ] Validatie functie: kaartpunten moeten optellen tot 162
- [ ] Waarschuwing tonen als totaal niet klopt
- [ ] Optioneel: automatisch corrigeren

**Bestanden te wijzigen:**
- `app.js` - Validatie functie in `addRound()`

---

### 6. Opsplitsing Scores Weergeven
**Wat ontbreekt:**
- Alleen totaal score wordt getoond
- Geen overzicht van kaartpunten, roem, bonussen

**Wijziging nodig:**
- [ ] Per ronde tonen: kaartpunten, roem, bonussen, totaal
- [ ] Aanpassen `updateGameSummary()` en ronde weergave
- [ ] Uitbreiden round object met opsplitsing

**Bestanden te wijzigen:**
- `app.js` - `updateGameSummary()` en ronde opslag
- `index.html` - UI voor opsplitsing
- `styles.css` - Styling

---

## 🟢 LAAG PRIORITEIT (Nice to have)

### 7. Troefkleur Tracking
**Wat ontbreekt:**
- Geen tracking welke kleur troef was

**Wijziging nodig:**
- [ ] Dropdown: "Troefkleur" (Harten, Ruiten, Klaveren, Schoppen)
- [ ] Opslaan in round object
- [ ] Optioneel weergeven in spel samenvatting

**Bestanden te wijzigen:**
- `index.html` - Nieuwe dropdown
- `app.js` - Opslag in round object

---

## 📊 SAMENVATTING

**Totaal wijzigingen:**
- 🔴 Hoog: 3 wijzigingen (Laatste slag, Roem, Nat)
- 🟡 Medium: 3 wijzigingen (Pit, Validatie, Opsplitsing)
- 🟢 Laag: 1 wijziging (Troefkleur)

**Geschatte impact:**
- UI wijzigingen: ~15-20 nieuwe velden/buttons
- Code wijzigingen: ~200-300 regels nieuwe logica
- Testen: Alle scenario's (normaal, nat, pit, roem)

---

## ✅ ACTIE VEREIST

**Geef hieronder akkoord voor elke wijziging die je wilt doorvoeren:**

```
[ ] 1. Laatste Slag Bonus
[ ] 2. Roem Invoer
[ ] 3. Nat Check
[ ] 4. Pit Bonus
[ ] 5. Score Validatie
[ ] 6. Opsplitsing Scores
[ ] 7. Troefkleur Tracking
```

**Of geef aan:**
- [ ] Alle wijzigingen doorvoeren
- [ ] Alleen hoog prioriteit
- [ ] Alleen specifieke wijzigingen (geef nummers op)
