# SPECIFICATION DOCUMENT

## Projekt: Matheheftt – Interaktiver schriftlicher Rechentrainer

---

# 1. Zieldefinition

Matheheftt ist eine didaktische Lernsoftware zum Üben schriftlicher Rechenverfahren für Kinder.
Die Anwendung soll nicht nur Ergebnisse prüfen, sondern den vollständigen Rechenweg visualisieren, validieren und pädagogisch begleiten.

---

# 2. Produktvision

Das System soll langfristig ein vollständig interaktives digitales Rechenheft sein, das:

* schriftliche Rechenverfahren exakt wie im Schulheft darstellt
* Fehler erkennt und erklärt
* Lernfortschritt analysiert
* adaptive Aufgaben generiert
* visuelles Feedback gibt

---

# 3. Architekturgrundprinzipien

## 3.1 Designphilosophie

Das System folgt strikt dem Prinzip:

> Mathematik-Logik ≠ Darstellung ≠ Zustand ≠ Didaktik

Trennung in Layer:

```
Math Engine Layer
Step Model Layer
Layout Engine Layer
Renderer Layer
State Layer
Pedagogy Layer
```

---

## 3.2 Architekturziele

* deterministische Engines
* keine UI-Logik in Berechnungen
* strikt typisierte Daten
* keine hardcoded Layouts
* modular erweiterbar

---

# 4. Systemarchitektur

## 4.1 Zielordnerstruktur

```
src/
 ├ engine/
 ├ layout/
 ├ renderers/
 ├ pedagogy/
 ├ validation/
 ├ state/
 ├ types/
 └ ui/
```

---

## 4.2 Engine Interface (verpflichtend)

```ts
interface MathEngine {
 generate(problemConfig): StepResult
 validate(stepState): ValidationResult
}
```

---

## 4.3 StepResult Struktur

```ts
type StepResult = {
 type: OperationType
 steps: Step[]
 grid: GridDefinition
 solution: GridDefinition
 metadata: StepMeta
}
```

---

# 5. Mathematische Engines

## 5.1 Pflicht-Engines

| Engine         | Status   |
| -------------- | -------- |
| Addition       | required |
| Subtraction    | required |
| Multiplication | required |
| Division       | required |

---

## 5.2 Erweiterungs-Engines (Phase 2)

* Brüche
* Dezimalzahlen
* Potenzen
* Gleichungen
* Prozentrechnung

---

## 5.3 Engine Regeln

Alle Engines müssen:

* jeden Zwischenschritt liefern
* Rechenweg modellieren
* Restwerte liefern
* Überträge speichern
* Entleihen speichern

---

# 6. Grid System

## 6.1 Neues Modell (Pflicht)

Ersetze Dictionary Grid durch Matrix:

```ts
type GridMatrix = Cell[][]
```

Grund:

* mathematische Operationen sind spaltenbasiert
* schnellere Iteration
* logische Struktur

---

## 6.2 Cell Definition

```ts
type Cell = {
 value: string
 expected?: string
 role: CellRole
 editable: boolean
 status?: ValidationState
}
```

---

## 6.3 Cell Roles

Pflichtrollen:

* digit
* operator
* carry
* borrow
* result
* helper
* separator

---

# 7. Layout Engine

## 7.1 Zweck

Transformiert mathematische Steps in visuelle Struktur.

Input:

```
StepResult
```

Output:

```
LayoutDefinition
```

---

## 7.2 LayoutDefinition

```ts
type LayoutDefinition = {
 cells: PositionedCell[]
 lines: Line[]
 labels?: Label[]
}
```

---

## 7.3 Regeln

* Layout darf keine Mathematik berechnen
* Layout darf nur positionieren
* Layout muss deterministisch sein

---

# 8. Renderer System

## 8.1 Renderer Resolver

```ts
getRenderer(operationType)
```

---

## 8.2 Renderer Typen

| Renderer               | Zweck                 |
| ---------------------- | --------------------- |
| DivisionRenderer       | schriftliche Division |
| AdditionRenderer       | Spaltenaddition       |
| SubtractionRenderer    | Entleihen Darstellung |
| MultiplicationRenderer | Teilprodukte          |

---

## 8.3 Renderer Regeln

Renderer dürfen:

* nur Layout darstellen
* keine Logik enthalten
* keine Zahlen berechnen

---

# 9. Validation Engine

## 9.1 Validierungsstufen

| Level  | Beschreibung   |
| ------ | -------------- |
| Cell   | einzelne Zelle |
| Step   | Schritt        |
| Column | Spalte         |
| Final  | Ergebnis       |

---

## 9.2 Ergebnisstruktur

```ts
type ValidationResult = {
 correct: boolean
 errors: CellError[]
 hints?: Hint[]
}
```

---

# 10. Pädagogik-Layer

## 10.1 Ziel

Fehler sollen nicht nur erkannt werden, sondern erklärt werden.

---

## 10.2 Fehlertypen

* falscher Übertrag
* falscher Rest
* falsche Subtraktion
* falsche Spalte
* Vorzeichenfehler

---

## 10.3 Hint Engine

Beispiel:

> „Du hast den Übertrag vergessen.“

---

# 11. Aufgaben-Generator

## 11.1 Difficulty Engine

Difficulty beeinflusst:

* Stellenzahl
* Carry Wahrscheinlichkeit
* Borrow Wahrscheinlichkeit
* Restwahrscheinlichkeit
* Nullstellen
* Übergänge

---

## 11.2 Difficulty Schema

```ts
type Difficulty = {
 digits: number
 carryChance: number
 borrowChance: number
 remainderChance: number
}
```

---

# 12. State Management

State enthält:

* aktuelles Problem
* StepResult
* UserGrid
* Validation
* Focus
* Mode

---

# 13. UX Anforderungen

## Pflicht

* Fokus-Navigation
* Pfeiltastensteuerung
* Enter → nächste Zelle
* Fehlerhighlight
* Schrittanzeige

---

## Optional Phase 2

* Animationen
* Soundfeedback
* Fortschrittsanzeige

---

# 14. Performance Anforderungen

* Render < 16ms
* Grid Updates < 5ms
* Engine < 1ms pro Aufgabe

---

# 15. Teststrategie

## Pflichttests

* Engine correctness tests
* Step sequence tests
* Validation tests
* Layout tests

---

# 16. Security

Keine externe API notwendig.
Keine Nutzerdaten speichern ohne Zustimmung.

---

# 17. Erweiterbarkeit

Architektur muss unterstützen:

* neue Rechenarten ohne Refactor
* neue Renderer ohne Engine Änderung
* neue Validierungen ohne UI Änderung

---

# 18. Development Phasen

---

## Phase 1 — Foundation

* Engine Interface
* Grid Matrix
* Division Engine

---

## Phase 2 — Rendering

* Layout Engine
* Renderer System
* Division Renderer

---

## Phase 3 — Didaktik

* Validation Engine
* Hint Engine

---

## Phase 4 — Erweiterung

* weitere Engines
* Difficulty System

---

## Phase 5 — UX

* Animation
* Sounds
* Gamification

---

## Phase 6 — Production

* Tests
* Optimierung
* Accessibility

---

## Phase 7 — Controller & State Machine

* MathSessionController (Zustandsverwaltung)
* Status-Übergänge (idle -> generated -> solving -> correct -> error -> finished)
* Undo-Funktionalität

---

## Phase 8 — Adaptive Task Generator (In Progress)

* [x] SeededRandom (Deterministische Zufallszahlen)
* [x] Difficulty Profiles
* [x] Student Model Integration (Mock implementation)
* [x] Anti-Repetition Guard (Full implementation)

---

## Phase 9 — UX Flow Engine (Implemented)

* Entkoppelte Interaktionslogik
* Auto-Advance
* Error Correction Focus
* Animation Triggers (Framer Motion)

---

## Phase 10 — System Hardening & Observability

* TelemetryLogger (Input, Steps, Errors, Duration)
* SessionReplay (Deterministisches Abspielen)
* DiagnosticOverlay (Dev-Tool via CTRL+ALT+D)
* EngineValidator (Konsistenzprüfung)
* PerformanceMonitor

---

# 19. Definition of Done

Feature gilt als fertig wenn:

* vollständig typisiert
* getestet
* deterministisch
* erweiterbar
* ohne Hardcoding
* visuell korrekt

---

# 20. Architekturprinzipien (unverhandelbar)

1. Keine UI-Logik in Engines
2. Keine Math-Logik im Renderer
3. Keine State-Mutation außerhalb Store
4. Keine Magic Numbers
5. Keine Any-Types

---

# 21. Wichtigste Designregel

> Erst korrekt rechnen
> dann korrekt darstellen
> dann schön darstellen

---

# 22. Langfristige Vision

Zielsystem soll später können:

* Schulmodus
* Lehrer-Dashboard
* Fortschrittsanalyse
* adaptive Aufgaben

---

# FINAL SUMMARY

Dieses Projekt besitzt bereits eine solide Grundlage.
Wenn diese Spezifikation befolgt wird, entsteht daraus ein professionelles, skalierbares Lernsystem mit echter didaktischer Qualität.

---

**End of Spec**
