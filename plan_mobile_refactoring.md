# Umfassender Plan: Mobile-First & Responsive Refactoring (Fokus: Matheheft)

## 1. Ausgangslage & Problemanalyse
Das aktuelle UI ist stark auf Desktop-Nutzung (Maus & Tastatur, viel Platz) optimiert. Auf mobilen Endgeräten – insbesondere im Querformat (Landscape) – treten folgende Probleme auf:

1. **Vertikaler Platzmangel (Landscape-Problem):** 
   - Die `Toolbar` (Kopfzeile) nimmt zu viel Höhe ein und bricht unschön um.
   - Die `TaskInstructionCard` (Anweisung) verbraucht wertvollen vertikalen Raum.
   - Wenn sich die native Smartphone-Tastatur öffnet, bleibt fast kein Platz mehr für das eigentliche Rechengitter (`GridRenderer`).
2. **Horizontales Scrolling:** 
   - Das Rechengitter hat feste Zellengrößen (z.B. `w-12 h-12`). Lange Aufgaben (wie `parentheses_evaluation`) passen nicht auf den Bildschirm und erzwingen horizontales Scrollen.
3. **Touch-Bedienung:** 
   - Hinweistexte wie "Klicken zum Schreiben • Pfeiltasten zum Bewegen" sind auf Touch-Geräten irrelevant.
   - Die native Tastatur verdeckt oft das Eingabefeld.

---

## 2. Kernstrategie des Refactorings

Wir müssen die App von einem statischen Desktop-Layout zu einer **responsiven, App-ähnlichen Experience** umbauen. 

### A. Viewport & Layout-Fundament
- **Dynamic Viewport Units (`dvh`):** Nutzung von `h-[100dvh]` statt `h-screen`, damit die UI nicht unter der Adressleiste von mobilen Browsern (Safari/Chrome) verschwindet.
- **Zoom-Prävention:** `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>` in der `index.html`, um versehentliches Zoomen beim schnellen Tippen zu verhindern.

### B. Das Tastatur-Problem (Der Gamechanger)
Anstatt sich auf die native Smartphone-Tastatur zu verlassen (die das Layout zerstört), implementieren wir ein **Custom On-Screen Numpad** (virtuelle Tastatur) für Touch-Geräte.
- **Portrait-Modus (Hochformat):** Numpad am unteren Bildschirmrand.
- **Landscape-Modus (Querformat):** Numpad am rechten oder linken Bildschirmrand, um die volle Höhe für das Rechengitter zu nutzen.

---

## 3. Komponenten-Spezifischer Refactoring-Plan

### 3.1. `Toolbar.tsx` (Kopfzeile)
- **Desktop (`md:` und größer):** Bleibt wie bisher.
- **Mobile Portrait:** Kompakte Ansicht. Nur das Wichtigste (Punktestand, Timer, Menü-Burger-Icon).
- **Mobile Landscape:** Extrem reduziert (Micro-Header) oder sogar "Auto-Hide" (verschwindet beim Scrollen/Tippen), da die vertikale Höhe hier das wichtigste Gut ist.
- **Entfernen von Desktop-Texten:** "Pfeiltasten zum Bewegen" wird auf Touch-Geräten ausgeblendet (z.B. via `hidden md:block`).

### 3.2. `TaskInstructionCard.tsx` (Anweisungen)
- Nutzung des bereits vorbereiteten `mode="compact"` auf kleinen Bildschirmen.
- Im Landscape-Modus: Umbau zu einem schwebenden "Toast" oder einer einklappbaren Leiste (Accordion), die standardmäßig nur ein Icon + Titel zeigt und bei Tap aufklappt.

### 3.3. `GridRenderer.tsx` (Das Rechengitter)
Das Gitter muss immer vollständig sichtbar sein (kein Scrollen, wenn möglich).
- **Responsive Zellengrößen:** Statt festen Pixelwerten nutzen wir CSS-Variablen oder Tailwind-Klassen, die sich anpassen (z.B. `w-8 h-8` auf Mobile, `w-12 h-12` auf Desktop).
- **Skalierung (Transform Scale):** Wenn eine Aufgabe extrem breit ist (z.B. 10 Spalten), berechnen wir die verfügbare Breite und wenden `transform: scale(...)` auf den Container an, damit er exakt in den Viewport passt.

### 3.4. `MathSessionScreen.tsx` (Der Haupt-Container)
- **Flexbox-Optimierung:** Der Screen wird ein strikter Flex-Container. 
  - Header: `flex-shrink-0`
  - Grid-Bereich: `flex-1 overflow-hidden flex items-center justify-center` (nimmt den gesamten Restplatz ein).
  - Numpad (neu): `flex-shrink-0` am unteren oder seitlichen Rand.

---

## 4. Implementierungs-Phasen (Roadmap)

### Phase 1: CSS & Layout-Fundament (Quick Wins)
1. Meta-Viewport in `index.html` anpassen (Zoom deaktivieren).
2. `h-screen` durch `h-[100dvh]` in den Haupt-Containern ersetzen.
3. `Toolbar.tsx` aufräumen: Unnötige Texte auf Mobile ausblenden (`hidden md:flex`), Layout auf Flex-Wrap oder kompakte Icons umstellen.
4. `TaskInstructionCard` auf Mobile zwingend im `compact`-Modus rendern.

### Phase 2: Grid-Skalierung (Das Herzstück)
1. `GridRenderer` so umbauen, dass er sich an den Parent-Container anpasst.
2. Implementierung eines `useResizeObserver` Hooks, der die Breite des Bildschirms misst und das Gitter bei Bedarf herunterskaliert (`transform: scale`), damit es nie abgeschnitten wird.

### Phase 3: Custom Numpad & Touch-Optimierung (Königsdisziplin)
1. Erstellen einer neuen Komponente `VirtualNumpad.tsx` (Ziffern 0-9, Enter, Backspace).
2. Erkennung von Touch-Geräten (oder generelle Nutzung auf Mobile).
3. Wenn Mobile erkannt wird: Native Inputs auf `readOnly` setzen (damit die Smartphone-Tastatur *nicht* aufpoppt) und stattdessen das `VirtualNumpad` die Eingaben an den `GridRenderer` senden lassen.
4. Layout-Anpassung für das Numpad (unten im Hochformat, seitlich im Querformat).

---

## 5. Zusammenfassung für Codex AI
Dieser Plan zielt darauf ab, das "Web-Seiten"-Gefühl zu entfernen und eine "Native App"-Experience zu schaffen. Das größte Problem im Querformat ist die native Tastatur in Kombination mit starren UI-Elementen. Durch ein responsives Grid (Skalierung) und eine virtuelle In-App-Tastatur lösen wir das Platzproblem elegant und nachhaltig.
