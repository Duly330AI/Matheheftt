# SPEC-8: Parentheses Evaluation Exercise (Repo-konform)

## Ziel
Neue Übungsart, bei der Schüler Ausdrücke der Form `a ± (b ± c)` vollständig lösen.

Didaktisches Ziel (Klasse 5+):
1. Inneren Klammerterm berechnen
2. Ergebnis in äußeren Term einsetzen
3. Endergebnis per schriftlicher Addition/Subtraktion lösen

Die Übung muss in die bestehende Architektur passen:
- `TaskGenerator` + Strategy
- `MathEngine`/Plugin Registry
- `MathSessionController` (Schrittvalidierung)
- `GridRenderer` / `GridCell` (1 Zeichen pro Zelle)
- Telemetrie + Planner + StudentModel

## Scope
### Must Have
- Pattern:
  - `a + (b + c)`
  - `a + (b - c)`
  - `a - (b + c)`
  - `a - (b - c)`
- Schrittbasiertes Lösen (3 pädagogische Schritte)
- Ein Zeichen pro Eingabezelle
- Sofortiges Feedback über bestehende Validierungslogik
- Kompatibel mit bestehendem Session-/Grid-System
- Generator liefert nur gültige Aufgaben (`inner >= 0`, `final >= 0`)

### Should Have
- Schwierigkeit über Zahlengröße (`digits`)
- Planner-Integration als eigene Task-Kategorie
- Skill-Tracking im StudentModel

### Won't Have (MVP)
- Verschachtelte Klammern
- Multiplikation/Division in Klammern

## Repo-Konforme Architektur
### Neue Artefakte
1. `src/generator/strategies/parenthesesEvaluation.strategy.ts`
2. `src/engine/algebra/ParenthesesEvaluationEngine.ts`
3. `src/engine/algebra/ParenthesesEvaluationPlugin.ts`
4. `src/engine/__tests__/ParenthesesEvaluationEngine.test.ts`
5. `src/generator/__tests__/ParenthesesEvaluationStrategy.test.ts`

### Bestehende Dateien, die angepasst werden müssen
1. `src/generator/TaskGenerator.ts` (Strategy registrieren)
2. `src/generator/profiles/difficultyProfiles.ts` (`OperationType` + `ProblemConfig`)
3. `src/engine/index.ts` (Plugin registrieren)
4. `src/engine/types.ts` (`StepType`, `OperationType`, `ErrorType`)
5. `src/types.ts` (`TaskType`)
6. `src/components/StartScreen.tsx` (Task-Auswahl)
7. `src/components/MathSessionScreen.tsx` (Operation-Mapping, Profile, Start-Flow)
8. `src/student/StudentModel.ts` (Skill-/Error-Mapping)
9. `src/planner/LearningPathPlanner.ts` + `src/components/MathSessionScreen.tsx` (`availableTasks`)

## Canonical IDs / Naming
### TaskType (UI)
- Neuer Wert: `parentheses_evaluation`

### Generator OperationType (`difficultyProfiles.ts`)
- Neuer Wert: `parentheses_evaluation`

### Engine Plugin ID (`engineRegistry`)
- Neuer Wert: `parentheses_evaluation`

### Skill IDs
- Hauptskill: `algebra_parentheses_evaluation`
- Abhängigkeiten:
  - `addition_carry`
  - `subtraction_borrow`
  - `algebra_parentheses_insertion`

### ErrorType
- Neuer Fehler:
  - `WRONG_PARENTHESES_RESULT`

## Datenmodell
`ProblemConfig` wird erweitert:
```ts
interface ProblemConfig {
  // ...
  a?: number;
  b?: number;
  c?: number;
  outerOp?: '+' | '-';
  innerOp?: '+' | '-';
}
```

Hinweis: Kein neues globales Interface außerhalb von `ProblemConfig` nötig, damit bestehender Generator/Engine-Vertrag erhalten bleibt.

## Generator-Algorithmus
Datei: `src/generator/strategies/parenthesesEvaluation.strategy.ts`

### Eingaben
- `DifficultyProfile.operation === 'parentheses_evaluation'`
- `digits` steuert Größenordnung:
  - `2` -> `10..99`
  - `3` -> `100..999` (optional für später)

### Erzeugung
1. Ziehe `a, b, c`, `outerOp`, `innerOp`.
2. Berechne `inner = b innerOp c`.
3. Berechne `final = a outerOp inner`.
4. Re-rollen bis:
  - `inner >= 0`
  - `final >= 0`

### Return
```ts
{
  type: 'parentheses_evaluation',
  a, b, c, outerOp, innerOp
}
```

## Engine- und Step-Modell
Datei: `src/engine/algebra/ParenthesesEvaluationEngine.ts`

### Step-Design (pedagogisch)
1. `parentheses_inner_result`
  - Zielzellen: Ergebnis von `(b innerOp c)`
  - Fehler bei falschem Ergebnis: `WRONG_PARENTHESES_RESULT`
2. `parentheses_substitute`
  - Zielzellen: eingesetzter Wert `inner` im äußeren Term
3. `add_column` / `carry` oder `subtract_column` / `borrow`
  - Wiederverwendung der vorhandenen schriftlichen Logik (digitweise)

### Typerweiterungen in `src/engine/types.ts`
- `StepType` ergänzen um:
  - `parentheses_inner_result`
  - `parentheses_substitute`
- `OperationType` ergänzen um:
  - `parentheses_evaluation`
- `ErrorType` ergänzen um:
  - `WRONG_PARENTHESES_RESULT`

### Validierung
- Weiterhin über `validate(stepState)` pro aktivem Step.
- Bei falschen Ziffern:
  - `errors[]` mit Zellpositionen
  - `hints[]` mit `messageKey`
  - `errorType` gesetzt

## Grid-Layout (MVP)
Layout bleibt matrixbasiert, pro Eingabefeld 1 Zeichen.

Empfehlung:
1. Zeilen 0..n: Aufgabendarstellung (`a ± (b ± c)`)
2. Eigene Eingabezeile für Step 1 (inneres Ergebnis)
3. Eigene Eingabezeile für Step 2 (Substitution)
4. Schriftliche Endrechnung (wie Add/Sub-Engines)

Wichtig: Das Layout darf vom `GridRenderer` ohne Sonderfälle renderbar sein.

## UI-Integration
### StartScreen
In `src/components/StartScreen.tsx` neue auswählbare Übungsart:
- `taskType === 'parentheses_evaluation'`
- Label z. B. `a ± (b ± c)`

### MathSessionScreen
In `src/components/MathSessionScreen.tsx`:
1. Mapping `TaskType -> currentOperation` ergänzen.
2. Profil-Mapping ergänzen:
   - `operation: 'parentheses_evaluation'`
3. `start(config)` für die neue Operation aufrufen.
4. Für Mixed Mode `availableTasks` um TaskDescriptor ergänzen:
   - `operation: 'parentheses_evaluation'`
   - `skillsTrained: ['algebra_parentheses_evaluation']`

## Plugin & Registry
### Plugin
Datei: `src/engine/algebra/ParenthesesEvaluationPlugin.ts`
- `id: 'parentheses_evaluation'`
- Skill-Definition enthält `algebra_parentheses_evaluation`

### Registry
Datei: `src/engine/index.ts`
- Plugin registrieren:
  - `registry.register(ParenthesesEvaluationPlugin);`

## StudentModel & Planner
### StudentModel
Datei: `src/student/StudentModel.ts`
- `mapOperationToMainSkill()` um `parentheses_evaluation` ergänzen.
- `mapErrorTypeToSkill()` um `WRONG_PARENTHESES_RESULT` für diese Operation ergänzen.
- `getRecommendedDifficulty()` optional um Regeln für den neuen Skill ergänzen.

### Learning Planner
- In `availableTasks` (aktuell in `MathSessionScreen`) neue Task aufnehmen.
- Optional in `LearningPathPlanner.errorSkillMap`:
  - `WRONG_PARENTHESES_RESULT -> algebra_parentheses_evaluation`

## Telemetrie / Analytics
Keine neuen TelemetryEventTypes nötig.

Bestehende Events reichen:
- `session_start`
- `error` (mit `errorType`)
- `step_transition`
- `session_end`

Metriken für Auswertung:
- Fehlerquote Step 1 vs. Step 3
- Zeit bis Task-Ende
- Häufigkeit von `WRONG_PARENTHESES_RESULT`

## Testplan
### Engine-Tests (`src/engine/__tests__/ParenthesesEvaluationEngine.test.ts`)
- alle 4 Operator-Kombinationen
- innerer Ausdruck mit Carry/Borrow-Situation
- äußerer Ausdruck mit Carry/Borrow-Situation
- korrekte Step-Reihenfolge
- `WRONG_PARENTHESES_RESULT` wird korrekt gesetzt

### Strategy-Tests (`src/generator/__tests__/ParenthesesEvaluationStrategy.test.ts`)
- deterministisch bei Seed
- `inner >= 0`
- `final >= 0`
- alle 4 Operator-Kombinationen über mehrere Seeds erreichbar

### Integrationsnahe Tests (optional)
- Erweiterung `TaskGenerator.test.ts` um neue Operation
- Erweiterung `StudentModel.test.ts` um Skill-Mapping

## Milestones
1. Typen + Generator-Strategy
2. Engine + Plugin + Registry
3. UI-Integration (`StartScreen`, `MathSessionScreen`)
4. StudentModel/Planner-Integration
5. Tests + Balancing

## Akzeptanzkriterien (Definition of Done)
1. `npm run lint` grün
2. `npm run test` grün
3. Neue Übung auswählbar und spielbar
4. Step 1-3 Verhalten reproduzierbar und korrekt
5. Fehler-Typ `WRONG_PARENTHESES_RESULT` wird geloggt und im StudentModel verarbeitet
6. Mixed Mode kann die neue Übung planen
