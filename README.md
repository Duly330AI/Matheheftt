# Matheheft Digital

Ein digitales kariertes Mathematikheft für schriftliche Rechenverfahren wie Addition, Subtraktion und Multiplikation. Das System ist als hochmodulare, deterministische EdTech-Plattform konzipiert, die nicht nur Ergebnisse prüft, sondern den vollständigen Rechenweg pädagogisch begleitet.

## Architektur & Features

Das System wurde nach strikten Software-Engineering-Prinzipien (Separation of Concerns) in 10 Phasen aufgebaut:

1. **Math Engines:** Deterministische Berechnung von Rechenwegen (Addition, Subtraktion, Multiplikation).
2. **Grid System:** Matrix-basierte Darstellung von Rechenkästchen.
3. **Pedagogy Layer:** Intelligente Fehleranalyse (erkennt z.B. vergessene Überträge).
4. **State Machine Controller:** Robuste Verwaltung des Session-Zustands.
5. **Adaptive Task Generator:** Deterministische, Seed-basierte Aufgabengenerierung.
6. **UX Flow Engine:** Intelligente Steuerung von Fokus, Auto-Advance und Animationen.
7. **System Hardening & Observability:** Telemetrie, Replay-System und Performance-Monitoring.

## Entwickler-Tools (Dev Mode)

- **Diagnostic Overlay:** Drücke `CTRL + ALT + D`, um das Live-Diagnose-Tool zu öffnen. Es zeigt den aktuellen State, Seed, erwartete Werte und Validierungs-Ergebnisse.

## Technologien

- React 18+
- TypeScript
- Tailwind CSS
- Vite
- Framer Motion (Animationen)
- Vitest (Headless Testing)

## Lokale Installation

**Voraussetzungen:** Node.js

1. Repository klonen:
   ```bash
   git clone https://github.com/Duly330AI/Matheheftt.git
   cd Matheheftt
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Tests ausführen:
   ```bash
   npm run test
   ```

4. Anwendung starten:
   ```bash
   npm run dev
   ```

Die Anwendung ist dann unter `http://localhost:3000` erreichbar.
