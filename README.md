# Pip-Boy 3000

A Fallout-inspired personal information processor built with React, TypeScript, and Vite. An original fan-made UI with glowing monochrome styling and fully interactive tabs. This is an unofficial project, not affiliated with Bethesda or Vault-Tec.

## What works

- **STAT** — character stats, S.P.E.C.I.A.L. attributes, health/radiation readouts, and a simple survival simulation.
- **INV** — browse items, filter categories, equip weapons/armor, and use Stimpaks, RadAway, and Nuka-Cola.
- **DATA** — track quests and mark objectives as completed.
- **MAP** — explore an original region and discover unknown locations.
- **RADIO** — tune three stations playing original synthesized ambient signals in your browser (no commercial music).
- **Persistence** — progress is saved locally in the browser; reset it from the settings footer.
- **Keyboard shortcuts** — `1`–`5` switch the main tabs. `Esc` closes settings.
- **Themes** — toggle green or amber phosphor.

## Run locally

Install [Node.js](https://nodejs.org/) 20.19+ and run:

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

For a production build:

```bash
npm run build
npm run preview
```

## Source repository

This project lives at [christophervalle85/pip-boy](https://github.com/christophervalle85/pip-boy) (private). The app runs locally and does not require a server or account.

## Commit messages

I write commit messages in first person, keeping them short, specific, and natural. For example: `I built the first playable version of my Pip-Boy`. See [COMMIT_STYLE.md](.github/COMMIT_STYLE.md) for examples.

## Suggested next steps

- Make the map larger with more discovered locations and quest markers.
- Add a save-slot system and character customization.
- Add a licensed or user-provided music library for the radio.
- Improve accessibility and mobile layouts.
- Add automated tests for gameplay actions.

The visual design and simulated radio are original. No copied game assets, music, or voice recordings are included.
