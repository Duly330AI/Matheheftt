# SPEC-10: Kontextuelle Aufgabenanleitung pro Übungsart (inkl. Mix-Modus)

## Ziel
Im Modus `Mix` (und optional auch in Einzelmodi) soll jederzeit klar sein, **was konkret zu tun ist**:

- Was ist das aktuelle Lernziel?
- Welcher Schritt ist gerade aktiv?
- Welche Eingabe wird erwartet (Ziffer, Operator, Klammer, Zwischenergebnis)?

Die aktuelle generische Nachricht `Tippe das Ergebnis für den markierten Bereich ein.` ist für komplexe Aufgaben (z. B. `insert_parentheses`, `parentheses_evaluation`, Division-Prozessschritte) nicht ausreichend.

---

## Problem-Analyse (Ist-Zustand)

## 1. Aktuelle UX-Lücke
In `MathSessionScreen` wird im neutralen Zustand nur ein generischer Text angezeigt:

- Datei: `src/components/MathSessionScreen.tsx`
- Aktuelles Verhalten: `Tippe das Ergebnis für den markierten Bereich ein.`

Dadurch fehlt bei Übungswechseln im `Mix` die Kontextorientierung.

## 2. Vorhandene technische Bausteine
Die Codebase hat bereits fast alle Signale, die für kontextuelle Anleitungen nötig sind:

1. `currentOperation` im Session-Screen
- Quelle: `MathSessionScreen`
- Werte z. B. `addition`, `subtraction`, `division`, `insert_parentheses`, `parentheses_evaluation`

2. `currentStep.type` und `currentStep.explanationKey`
- Quelle: `MathSessionState.steps[currentStepIndex]`
- Typen in `src/engine/types.ts` (z. B. `add_column`, `borrow`, `divide_bring_down`, `insert_parentheses`, `parentheses_inner_result`, `parentheses_substitute`)

3. Bestehende Übersetzungsstruktur (lokal)
- Aktuell als `t()`-Dictionary direkt in `MathSessionScreen`
- Schon vorhanden für diverse `hint_*` und einzelne `*_explanation` Keys

## 3. Architektur-Lücke
Es gibt derzeit **kein zentrales Instruction-System**, das

- `operation` + `stepType` -> „Was tun“-Text auflöst,
- Prioritäten zwischen allgemeinen und schrittspezifischen Anleitungen regelt,
- konsistent in UI-Komponenten dargestellt wird.

---

## Zielbild

Für jede Aufgabe gilt:

1. **Übungsanleitung (global pro Aufgabe)**
- Kurztext: „Ziel dieser Aufgabe“
- Beispiel: `Setze Klammern so, dass die Rechnung 56 ergibt.`

2. **Schrittanleitung (pro aktuellem Step)**
- Konkrete Aktion für den nächsten Eingabeschritt
- Beispiel: `Berechne zuerst den Ausdruck in der Klammer.`

3. **Input-Hinweis (optional)**
- Welche Zeichen sind erlaubt oder erwartet
- Beispiel: `Erlaubte Zeichen: Ziffern und +/-`

4. **Fallback-Verhalten**
- Wenn kein spezifischer Text existiert: sauberes generisches Wording

---

## Scope

### Must Have
- Kontextuelle Anleitung für **alle aktuell registrierten Operationen**
  - `addition`, `subtraction`, `multiplication`, `division`, `algebra`, `insert_parentheses`, `parentheses_evaluation`
- Schrittbasierte Anleitungen für häufige StepTypes
- Sichtbare Anzeige im Session-UI, ohne bestehende Flow-Logik zu brechen
- Funktioniert stabil bei Aufgabenwechsel im Mix-Modus

### Should Have
- Trennung zwischen globaler Übungsanleitung und Step-Anleitung
- Einfache Erweiterbarkeit bei neuen Engines/StepTypes
- Telemetrie-Events zur Messung der Anleitungseffektivität

### Could Have
- Umschaltbar zwischen „kurz“ und „detailliert“ (z. B. per Profil)
- Visuelle Hervorhebung (Icon je Anleitungstyp)

---

## Repository-konforme Architektur

## A. Neue Domänenkomponente: Instruction Resolver

Neue Datei (Vorschlag):
- `src/session/InstructionResolver.ts`

Zweck:
- Zentraler Resolver für Texte auf Basis von:
  - `operation` (string)
  - `stepType` (`StepType`)
  - `explanationKey` (optional)

### Vorschlag API
```ts
export interface InstructionPayload {
  title: string;
  body: string;
  inputHint?: string;
  severity?: 'info' | 'guided' | 'warning';
}

export function resolveInstruction(input: {
  operation: string;
  stepType?: StepType;
  explanationKey?: string;
  status: MathSessionStatus;
}): InstructionPayload;
```

## B. Textkatalog auslagern

Neue Datei (Vorschlag):
- `src/session/instructionCatalog.ts`

Inhalt:
- `operationInstructions`: globale Zielbeschreibung pro Operation
- `stepInstructions`: konkrete Anleitung pro `StepType`
- `explanationKeyInstructions`: optionales Override pro `explanationKey`

Beispiel:
```ts
operationInstructions['insert_parentheses'] = {
  title: 'Klammern setzen',
  body: 'Setze Klammern so, dass der Zielwert erreicht wird.'
};

stepInstructions['insert_parentheses'] = {
  title: 'Klammerposition eingeben',
  body: 'Tippe den Ausdruck mit Klammern in die markierten Felder.'
};
```

## C. UI-Integration

Primärer Integrationspunkt:
- `src/components/MathSessionScreen.tsx`

Empfohlene Platzierung:
1. **Instruction-Panel über dem Grid** (persistent)
2. Bestehende **Feedback-Box unten** bleibt für Fehler/Erfolgsmeldungen

Regel:
- `status === 'error'`: Fehlertext bleibt dominant in Feedback-Box
- zusätzlich kann oben weiter die Step-Anleitung sichtbar sein

## D. Optionaler UI-Baustein

Neue Komponente (optional, sauber):
- `src/components/TaskInstructionCard.tsx`

Props:
```ts
{
  title: string;
  body: string;
  inputHint?: string;
  mode?: 'compact' | 'default';
}
```

Vorteil:
- `MathSessionScreen` bleibt schlank
- Styling/Accessibility zentral

---

## Instruction Prioritätssystem

Reihenfolge bei der Auflösung:

1. `error` Status -> Fehlertext (bestehend)
2. `explanationKey`-spezifische Anleitung (falls vorhanden)
3. `stepType`-spezifische Anleitung
4. `operation`-spezifische allgemeine Anleitung
5. generischer Fallback

Fallbacktext (Vorschlag):
- Titel: `Nächster Schritt`
- Body: `Bearbeite den markierten Bereich Schritt für Schritt.`

---

## Inhaltliche Mindestabdeckung (Katalog)

## Operationsebene
- Addition: „Addiere spaltenweise von rechts nach links.“
- Subtraktion: „Subtrahiere spaltenweise; beachte Entleihen/Übertrag.“
- Multiplikation: „Berechne Teilprodukte und addiere sie anschließend.“
- Division: „Schätzen, multiplizieren, subtrahieren, herunterholen.“
- Algebra (expand): „Löse Klammern mit dem Distributivgesetz auf.“
- Insert Parentheses: „Setze Klammern so, dass der Zielwert entsteht.“
- Parentheses Evaluation: „Rechne zuerst innen, dann außen.“

## StepType-Ebene (Auswahl)
- `add_column`
- `carry`
- `subtract_column`
- `borrow`
- `multiply_digit`
- `divide_estimate`
- `divide_bring_down`
- `insert_parentheses`
- `parentheses_inner_result`
- `parentheses_substitute`

---

## Accessibility / UX-Anforderungen

1. Lesbarkeit
- Titel + 1-2 kurze Sätze
- Keine langen Fließtexte

2. Persistenz
- Bei Eingaben darf die Anleitung nicht „springen"
- Wechsel nur, wenn `currentStepIndex` wechselt oder Operation wechselt

3. Mobile
- Kompakte Variante (`mode='compact'`) möglich
- Keine Überlagerung des Grids

4. Konsistenz
- Terminologie in UI konsistent mit Buttons/Toolbar

---

## Telemetrie (optional, empfohlen)

Bestehende Eventtypen können erweitert genutzt werden:
- `diagnostic_event` oder neues Payload-Feld in `step_transition`

Metriken:
1. Fehlerrate pro StepType vor/nach Einführung
2. Zeit bis erster korrekter Input pro StepType
3. Abbruchrate im Mix-Modus

---

## Betroffene Dateien (geplant)

Pflicht:
- `src/components/MathSessionScreen.tsx`
- `src/session/InstructionResolver.ts` (neu)
- `src/session/instructionCatalog.ts` (neu)

Optional:
- `src/components/TaskInstructionCard.tsx` (neu)
- `src/session/__tests__/InstructionResolver.test.ts` (neu)

Keine Änderungen nötig an:
- Engines (Rechenlogik)
- SessionController (State-Machine-Kern)

---

## Implementierungsplan (phasenweise)

## Phase 1: Basis
1. `instructionCatalog.ts` anlegen
2. `InstructionResolver.ts` implementieren
3. In `MathSessionScreen` Instruction-Payload berechnen und anzeigen
4. Fallbacks definieren

## Phase 2: Abdeckung
1. Alle aktiven StepTypes mit Texten versehen
2. Spezielle Texte für `insert_parentheses` und `parentheses_evaluation`
3. UI-Feinschliff (Spacing, mobile)

## Phase 3: Qualität
1. Unit-Tests für Resolver
2. Integrationstests für Mix-Wechsel
3. (Optional) Telemetrie-Messung hinzufügen

---

## Testplan

## Unit
- Resolver gibt für Kombinationen `(operation, stepType, status)` die erwartete Anleitung zurück.
- Fallbacks funktionieren für unbekannte Keys.

## Integration
- Wechsel in `mixed` von `addition` -> `insert_parentheses` aktualisiert Anleitung korrekt.
- Bei `status='error'` bleibt Fehlermeldung dominant, Anleitung bleibt verständlich.

## Manuell
- Szenario Mix über 10 Aufgaben:
  - Jede neue Übungsart zeigt erkennbar „was zu tun ist“.
  - Keine Verwechslung bei Klammeraufgaben.

---

## Akzeptanzkriterien

1. Für jede registrierte Operation wird eine globale Aufgabenbeschreibung angezeigt.
2. Für relevante StepTypes wird eine konkrete Schrittanweisung angezeigt.
3. Im Mix-Modus wechselt die Anleitung korrekt mit der geplanten Aufgabe.
4. Fehlerfeedback bleibt erhalten und wird nicht überdeckt.
5. `npm run lint` und `npm run test` bleiben grün.

---

## Risiken & Gegenmaßnahmen

1. Risiko: Textpflege verteilt sich wieder auf mehrere Dateien.
- Gegenmaßnahme: zentraler Katalog + Resolver, kein Direkt-Mapping in UI-Komponente.

2. Risiko: Zu viele Texte überladen die UI.
- Gegenmaßnahme: kurze Texte, optional kompakter Modus.

3. Risiko: Neue StepTypes ohne Texte.
- Gegenmaßnahme: verpflichtender Fallback + Test für Katalogabdeckung.
