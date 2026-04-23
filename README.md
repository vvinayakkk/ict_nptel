<p align="center">
  <img src="/public/logo.svg" alt="NPTEL Prep" width="110" />
</p>

<h1 align="center">NPTEL Prep App</h1>

<p align="center">
  Lightweight, keyboard-first web app to practice NPTEL-style multiple-choice questions (MCQs). One question at a time, instant feedback, persistent progress, and a polished responsive UI for desktop & mobile.
</p>

---

## Screenshots

![Home](/public/home.png)
![Stats](/public/stats.png)

---

## Features

- Focused single-question UI with immediate correct/wrong feedback.
- Randomized order each session; Restart reshuffles.
- Persistent local progress.
- Mobile-first, accessible UI with ARIA-enhanced progress.
- Keyboard-first: fast practice without leaving the keyboard.

---

## Keyboard shortcuts

- `1`–`5` - select option 1..5 (when present)
- `W` / `S` - move option focus up / down
- `Enter` / `Space` - select focused option
- `←` / `A` - previous question
- `→` / `D` - next question (or advance if current revealed)
- `R` - Restart session (clears progress and reshuffles)

---

## Data format

Edit `src/assets/data.json`. Expected structure:

```json
[
  {
    "question": "In which year was the Earth Summit held?",
    "options": ["1982", "1992", "2002", "2012"],
    "correctAnswer": "1992"
  }
]
```

Notes:

- `options` may contain 3–5 items. Keys `1`–`5` map to each option.
- `correctAnswer` must exactly match an option string.

---

## Project structure

```
project-root/
├─ index.html                # App entry point, SEO & social preview metadata
├─ public/                   # Static public assets
└─ src/
   ├─ main.jsx               # App bootstrap and React mount point
   ├─ App.jsx                # Core app logic (state, flow, keyboard handling)
   ├─ index.css              # Global styles & responsive rules
   ├─ assets/
   │  └─ data.json           # Question bank (quiz data)
   ├─ components/
   │  ├─ Header.jsx          # Header with logo, score, progress, restart button
   │  ├─ Progress.jsx        # Progress bar component
   │  └─ QuestionCard.jsx    # Question display and user interaction
   ├─ hooks/
   │  └─ useKeyboard.js      # Keyboard input handling logic
   └─ utils/
      └─ index.js            # Shuffle, load, and save functions
```

## Run locally

```bash
npm install
npm run dev
# then open http://localhost:5173
```

---

<p align="center">
  Built with ❤️ using React & Vite - optimized for quick focused practice.
</p>
