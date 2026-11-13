# EM0508 Spacecraft Systems Quiz

Interactive quiz for EM0508 Topics 1–8, built from the course notes, slides and tutorials.

Open `index.html` in a browser (or enable GitHub Pages on this repo).

## What's in it
- **472 questions** across 8 topics
- Every Tutorial 1–4 question (with the answer-sheet key), plus reworded / inverted versions
- Concept and detail questions from notes and slides (Topics 5–8 have no tutorial, so they are built from the slides)
- Figure questions using course diagrams (`img/`)
- Calculations that draw new numbers every run (orbital velocity, period, Kepler, F=ma, L=Iω, τ=Iα, thrust equation, Hohmann, etc.)
- Trap questions where the course text and real physics disagree, with explanations
- Open-ended tutorial questions with model answers (self-marked)

Modes: practice (feedback after each question) or exam (feedback at the end), filter by topic and question type, retry missed questions.

## Files
| File | Contents |
|---|---|
| `index.html` | Page, styles and quiz engine |
| `bank1.js` | Topics 1–2 |
| `bank1b.js` | Topics 3–4 |
| `bank2.js` | Topics 5–6 |
| `bank2b.js` | Topics 7–8 |
| `img/` | Figures exported from the course slides |

### Adding questions
```js
M(topic, category, question, [options], answerIndex, explanationHtml, ["img/file.jpg", "caption"]); // single answer
M(topic, category, question, [options], [i, j], explanationHtml);   // select-all
TF(topic, category, statement, true|false, explanationHtml);
O(topic, "open", question, modelAnswerHtml);
G(topic, "calc", () => ({ q, a, unit, e }));                        // generated numeric question
```
Categories: `tut`, `var`, `con`, `fig`, `calc`, `trap`, `open`.
