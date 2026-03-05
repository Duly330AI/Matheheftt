# SPEC-9: Parentheses Evaluation UX Fix (Minus-Eingabe + Spoilerfreie Rechenreihenfolge)

## Kontext
Beim Testen von `parentheses_evaluation` treten zwei UX-/Didaktikprobleme auf:

1. In Schritt 2 kann das `-` Zeichen nicht eingegeben werden.
2. Die schriftliche Rechnung unten rechts zeigt bereits die äußere Aufgabe (`a - innerResult`) und wirkt dadurch gespoilert.

Zusätzlich besteht didaktisch der Wunsch, dass zuerst der innere Ausdruck (z. B. `298 - 167`) schriftlich gerechnet wird.

---

## Root-Cause Analyse

### A. Warum ist kein Minus möglich?

#### Beobachtung
In `ParenthesesEvaluationEngine` wird das äußere Operator-Feld in Schritt 2 als editierbare Zelle mit Rolle `operator` erzeugt.

Datei:
- `src/engine/algebra/ParenthesesEvaluationEngine.ts`

Relevante Stelle:
- `createCell(..., role: 'operator', isEditable: true)` für `outerOp`.

#### Ursache
`GridCell` erlaubt bei editierbaren Feldern nur dann Operatorzeichen, wenn `role === 'algebra_term'`.
Für alle anderen Rollen (auch `operator`) ist nur `[0-9]` erlaubt.

Datei:
- `src/ui/grid/GridCell.tsx`

Relevantes Verhalten:
- `const isAlgebra = role === 'algebra_term'`
- `isAlgebra ? /^[a-zA-Z0-9+\-*()]$/ : /^[0-9]$/`

Folge:
- Ein editierbares `operator`-Feld akzeptiert kein `-`.

---

### B. Warum wirkt die Aufgabe unten rechts gespoilert?

#### Beobachtung
Die `ParenthesesEvaluationEngine` delegiert direkt an `AdditionEngine`/`SubtractionEngine` mit Operanden `a` und `innerResult`.
Dabei werden Operanden in den Sub-Engines sofort als nicht-editierbare, sichtbare Ziffern gesetzt.

Dateien:
- `src/engine/algebra/ParenthesesEvaluationEngine.ts`
- `src/engine/SubtractionEngine.ts`
- `src/engine/AdditionEngine.ts`

Folge:
- Die äußere schriftliche Rechnung ist sofort sichtbar, bevor der Lernende sie „selbst aufsetzt".

#### Didaktische Diskrepanz
Aktuelle Implementierung:
1. inneres Ergebnis eintippen
2. äußeren Term eintippen
3. äußere schriftliche Rechnung lösen

Gewünschtes Verhalten:
1. inneren Ausdruck schriftlich rechnen
2. Ergebnis substituieren
3. äußeren Ausdruck schriftlich rechnen

---

## Zielbild

1. `-` und `+` sind an relevanten Eingabestellen zuverlässig eingebbar.
2. Keine vorweggenommene sichtbare äußere schriftliche Rechnung.
3. Optional didaktische Aufwertung: innerer Ausdruck wird ebenfalls schriftlich gerechnet.

---

## Lösungsoptionen (repo-konform)

## Option A (Minimal-Invasiv, kurzfristig)

### Umfang
- Minus-Eingabe fixen
- Spoiler reduzieren (äußere Operanden nicht sofort sichtbar)
- Bestehende 3-Step-Logik behalten

### Änderungen
1. `GridCell` Eingabelogik erweitern
- Datei: `src/ui/grid/GridCell.tsx`
- Neue Regel: Wenn `role === 'operator' && isEditable`, dann nur `+` oder `-` erlauben.
- `inputMode` für editierbare Operatoren auf `text` setzen.

2. `ParenthesesEvaluationEngine` Schritt-2 Operatorfeld robust modellieren
- Datei: `src/engine/algebra/ParenthesesEvaluationEngine.ts`
- Entweder:
  - Feld bleibt Rolle `operator`, aber durch neue `GridCell`-Regel wird `-` akzeptiert.
  - oder Rolle `algebra_term` + zusätzlicher Validator (nur `+/-`).

3. Äußere schriftliche Rechnung „maskieren" bis Step 3 aktiv wird
- Datei: `src/engine/algebra/ParenthesesEvaluationEngine.ts`
- Bei den delegierten Sub-Engine-Zellen für Operanden:
  - sichtbaren `value` initial auf `''` setzen,
  - `expectedValue` beibehalten,
  - Anzeige erst ab Start der Sub-Engine-Steps freigeben (z. B. über vorbereitete Step-0 „setup" oder durch gezieltes Umschreiben beim Übergang von Step 2 auf Step 3).

### Vorteile
- Schnell umsetzbar.
- Kein kompletter Umbau des Step-Modells.

### Nachteile
- Innerer Ausdruck bleibt nicht schriftlich gerechnet, nur Ergebnis-basiert.

---

## Option B (Empfohlen, didaktisch sauber)

### Umfang
Neues 5-Step-Modell mit zwei schriftlichen Rechnungsphasen:

1. `inner_setup` (optional: Operanden des inneren Terms setzen)
2. `inner_written_calc` (delegierte Add/Sub-Steps für `b innerOp c`)
3. `substitute_outer` (`a outerOp innerResult` auf der Hauptzeile)
4. `outer_setup` (optional)
5. `outer_written_calc` (delegierte Add/Sub-Steps für `a outerOp innerResult`)

### Architekturansatz
- `ParenthesesEvaluationEngine` delegiert zweimal:
  - einmal für inneren Term,
  - einmal für äußeren Term.
- Beide Delegationen werden per `rowOffset` in ein gemeinsames Grid gemappt.
- Steps erhalten klare Prefixe in `id`:
  - `inner_*`, `outer_*`.

### Notwendige Typ-Erweiterungen
Datei: `src/engine/types.ts`

`StepType` ergänzen um:
- `parentheses_inner_setup`
- `parentheses_outer_setup`

(oder alternativ Setup ohne neue StepTypes über vorhandene Typen modellieren, wenn klar dokumentiert)

### Sichtbarkeits-/Spoiler-Regel
- Outer-Written-Section ist vor Abschluss der Inner-Section visuell neutral (leere Zellen).
- Keine finalen Operanden/Teilresultate vorzeitig anzeigen.

### Vorteile
- Entspricht dem gewünschten Lernpfad.
- Keine didaktischen Spoiler.
- Bessere Messbarkeit pro Phase (inner vs. outer Fehlerprofile).

### Nachteile
- Größerer Umbau als Option A.

---

## Empfohlene Umsetzung
Option B als Ziel, Option A als Hotfix davor.

## Phase 1 (Hotfix, 1 PR)
1. Minus-Eingabe in `GridCell` für editierbare `operator` erlauben.
2. `ParenthesesEvaluationEngine` Step 2 validieren, dass Operator nur `+/-` ist.
3. Kurzer Regressionstest für Minus-Eingabe.

## Phase 2 (Didaktik-Refactor, 1 PR)
1. `ParenthesesEvaluationEngine` auf inner+outer schriftliche Delegation umbauen.
2. Step-Reihenfolge und Fokusführung anpassen.
3. Outer-Teil bis Freigabe spoilerfrei halten.
4. Tests erweitern.

---

## Betroffene Dateien

Pflicht:
- `src/ui/grid/GridCell.tsx`
- `src/engine/algebra/ParenthesesEvaluationEngine.ts`
- `src/engine/__tests__/ParenthesesEvaluationEngine.test.ts`

Je nach Option B zusätzlich:
- `src/engine/types.ts`
- `src/session/MathSessionController.ts` (nur falls neue StepTypes Spezialbehandlung benötigen)
- `src/components/MathSessionScreen.tsx` (Hint-/Feedbacktexte)

---

## Testplan

### Unit Tests
1. `GridCell`: editierbares `operator` akzeptiert `+` und `-`, lehnt Ziffern/Buchstaben ab.
2. `ParenthesesEvaluationEngine`:
- `outerOp='-'` kann korrekt eingegeben werden.
- Kein Fehler bei partieller Eingabe in mehrstelligen Zwischenresultaten.
- Fehler-Typen korrekt (`WRONG_PARENTHESES_RESULT`, `CALCULATION_ERROR`, `BORROW_ERROR`/`CARRY_ERROR`).

### Szenario-Tests (Engine)
- `618 - (298 - 167)`:
  - Inner-Phase zuerst,
  - Substitution,
  - Outer-Phase danach,
  - keine vorzeitige Sichtbarkeit der Outer-Lösung.

### Regression
- Bestehende `insert_parentheses`-Flows bleiben unverändert.
- `npm run lint` und `npm run test` vollständig grün.

---

## Akzeptanzkriterien

1. In `parentheses_evaluation` kann in Schritt 2 ein `-` eingegeben werden.
2. Keine vorweggenommene sichtbare äußere schriftliche Rechnung vor dem vorgesehenen Schritt.
3. (Option B) Innerer Ausdruck wird schriftlich gerechnet, bevor der äußere gerechnet wird.
4. Alle Tests grün.
