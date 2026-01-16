# Analyse Klaverjassen Code

## ✅ Wat WERKT in de huidige code:

1. **Basis functionaliteit:**
   - ✅ 2 teams (Wij en Zij)
   - ✅ Maximaal 2 spelers per team (totaal 4 spelers)
   - ✅ Score invoer per team per ronde
   - ✅ Scores optellen over alle rondes
   - ✅ Totaal score per team weergeven
   - ✅ Spel opslaan in database
   - ✅ LocalStorage voor huidige spel

2. **Simulatie 3 rondes:**
   - ✅ Ronde 1: Team Wij 130, Team Zij 82 → Totaal: Wij 130, Zij 82
   - ✅ Ronde 2: Team Wij 0, Team Zij 470 → Totaal: Wij 130, Zij 552
   - ✅ Ronde 3: Team Wij 0, Team Zij 222 → Totaal: Wij 130, Zij 774
   - ✅ Winnaar bepaling werkt correct

## ❌ Wat ONTBREEKT volgens klaverjassen regels:

### 1. **ROEM (Bonus punten) - KRITIEK**
   - **Driekaart** (3 opeenvolgende kaartenzelfde kleur): +20 punten
   - **Vierkaart** (4 opeenvolgende kaartenzelfde kleur): +50 punten
   - **Stuk** (Heer + Vrouw van troef): +20 punten
   - **Vier gelijken** (4x10, 4xKoning, 4xVrouw, 4xAas): +100 punten
   - **Vier boeren**: +200 punten
   - **Probleem**: Geen invoer of berekening van roem
   - **Impact**: Scores kloppen niet zonder roem

### 2. **LAATSTE SLAG BONUS - KRITIEK**
   - Wie de laatste slag wint krijgt +10 punten
   - **Probleem**: Geen tracking wie laatste slag wint
   - **Impact**: 10 punten per ronde ontbreken

### 3. **PIT (MARS) BONUS - BELANGRIJK**
   - Als een team alle 8 slagen wint: +100 punten bonus
   - **Probleem**: Geen detectie of invoer van pit
   - **Impact**: 100 punten ontbreken bij pit situaties

### 4. **NAT CHECK - KRITIEK**
   - Als het spelende team < 82 kaartpunten haalt (zonder roem), gaan ALLE punten naar tegenstander
   - Moet weten wie "gegaan" is (wie speelt)
   - **Probleem**: Geen nat check, geen tracking wie "gegaan" is
   - **Impact**: Verkeerde score toekenning bij nat situaties

### 5. **SCORE VALIDATIE - BELANGRIJK**
   - Kaartpunten moeten optellen tot 162 (totaal punten in kaartspel)
   - Roem en bonussen komen daar bovenop
   - **Probleem**: Geen validatie dat scores kloppen
   - **Impact**: Foutieve scores kunnen worden ingevoerd

### 6. **OPSPLITSING SCORES - HANDIG**
   - Per ronde zou moeten tonen: kaartpunten, roem, bonussen, totaal
   - **Probleem**: Alleen totaal wordt getoond
   - **Impact**: Moeilijk te controleren of scores kloppen

### 7. **TROEFKLEUR TRACKING - OPTIONEEL**
   - Voor referentie welke kleur troef was
   - **Probleem**: Geen tracking
   - **Impact**: Geen, maar handig voor referentie

### 8. **WIE "GEGAAN" IS - BELANGRIJK VOOR NAT**
   - Moet weten welk team speelt voor nat check
   - **Probleem**: Geen tracking
   - **Impact**: Nat check kan niet worden uitgevoerd

## 📋 LIJST VAN WIJZIGINGEN NODIG:

### HOOG PRIORITEIT (Kritiek voor correcte puntentelling):

1. **Roem invoer/berekening toevoegen**
   - Voeg invoervelden toe voor roem per team per ronde
   - Of automatische detectie (complexer)
   - **Wijziging**: Nieuwe UI velden + logica in `addRound()`

2. **Laatste slag bonus toevoegen**
   - Vraag wie de laatste slag heeft gewonnen
   - Voeg +10 punten toe aan winnend team
   - **Wijziging**: Nieuwe UI veld + logica in `addRound()`

3. **Nat check implementeren**
   - Vraag per ronde welk team "gegaan" is (wie speelt)
   - Check of kaartpunten (zonder roem) < 82
   - Als nat: verplaats alle punten naar tegenstander
   - **Wijziging**: Nieuwe UI veld + logica in `addRound()`

### MEDIUM PRIORITEIT (Belangrijk voor volledigheid):

4. **Pit bonus toevoegen**
   - Vraag of een team alle 8 slagen heeft gewonnen
   - Voeg +100 punten toe
   - **Wijziging**: Nieuwe UI checkbox + logica in `addRound()`

5. **Score validatie toevoegen**
   - Valideer dat kaartpunten optellen tot 162
   - Waarschuw bij ongeldige scores
   - **Wijziging**: Validatie functie in `addRound()`

6. **Opsplitsing scores weergeven**
   - Toon per ronde: kaartpunten, roem, bonussen, totaal
   - **Wijziging**: UI aanpassing in `updateGameSummary()` en ronde weergave

### LAAG PRIORITEIT (Nice to have):

7. **Troefkleur tracking**
   - Dropdown om troefkleur per ronde te selecteren
   - **Wijziging**: Nieuwe UI veld + opslag in round object

## 🎯 AANBEVOLEN IMPLEMENTATIE VOLGORDE:

1. **Eerst**: Laatste slag bonus (simpel, +10 punten)
2. **Dan**: Roem invoer (belangrijkste ontbrekende feature)
3. **Dan**: Wie "gegaan" is + Nat check (complex maar kritiek)
4. **Dan**: Pit bonus (simpel, +100 punten)
5. **Dan**: Score validatie (helpt fouten voorkomen)
6. **Tenslotte**: Opsplitsing scores weergeven (UX verbetering)

## ⚠️ BELANGRIJKE OPMERKINGEN:

- **Huidige code werkt** voor basis score tracking, maar volgt niet de volledige klaverjassen regels
- **Handmatige invoer** van alle punten (inclusief roem/bonussen) is mogelijk, maar foutgevoelig
- **Geen automatische berekening** van roem, nat, pit - alles moet handmatig worden ingevoerd
- **Geen validatie** of ingevoerde scores kloppen volgens regels

## ✅ CONCLUSIE:

De code kan scores invoeren en optellen, maar mist kritieke klaverjassen-specifieke regels zoals:
- Roem berekening
- Nat check
- Laatste slag bonus
- Pit bonus
- Score validatie

**Aanbeveling**: Implementeer minimaal de HOOG PRIORITEIT features voor correcte puntentelling volgens klaverjassen regels.
