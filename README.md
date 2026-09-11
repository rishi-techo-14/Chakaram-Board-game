# ☸ Chakaram — Chowka Bara 3D Web Game

> **சக்கரம்** · *Chowka Bara · Katte Mane · Daayam · Ashtapada*
>
> An ancient South Indian board game — faithfully rebuilt for the browser.

---

## 🎮 Play Now

Open `index.html` in any modern browser after cloning. No build step, no dependencies to install.

```bash
git clone https://github.com/yourusername/chakaram.git
cd chakaram
python -m http.server 8080
# Open http://localhost:8080 in your browser
```

---

## 📖 What Is Chowka Bara?

**Chowka Bara** (also called *Katte Mane*, *Daayam*, or *Ashtapada*) is one of the oldest cross-and-circle strategy board games in South Asia — predating both Chess and Ludo. It was played for centuries across Tamil Nadu, Karnataka, and Andhra Pradesh using cowrie shells as dice and hand-carved wooden coins.

Despite its rich heritage, the game has nearly vanished from modern memory. **Chakaram** is an attempt to revive it — playable, beautiful, and true to the original rules.

---

## ✨ Features

### 🏛️ Authentic Gameplay Rules
- **Strict 1 or 5 rule** — A coin can only enter the board on a roll of 1 or 5
- **Bonus rolls** — Roll again on Daayam (1), Chowka (4), Ashta (8), Baara (12)
- **Capture & cut** — Land on an opponent's coin to send it back home
- **Inner track lock** — Must cut an opponent before entering the inner cross path
- **5×5 and 7×7** board sizes, each with their own cowrie count (4 or 6 shells)
- Sequential **clockwise turn order**: South → West → North → East

### 🎲 Cowrie Shell Dice (சோழி)
- **4 or 6 Chozhi** depending on board size
- Each shell is a UV-mapped 3D model with realistic dorsal and ventral textures
- Shells physically toss, spin, and settle in a brass rolling tray placed **beside** the board
- Score display in both **Tamil numerals (௧ ௨ ௩...)** and Arabic

### 🪵 Authentic Wooden Board
- **Natural birchwood** 5×5 or 7×7 grid — matches traditional handcrafted boards
- **4 midpoint safe-house emblems** — hand-engraved 4-petal floral circles
- **Center mandala rosette** — intricate lotus pattern for the goal square
- Thin black grid lines, wooden rim and peedam (base) — all procedurally generated

### ♟️ Lathe-Turned Hardwood Coins
| Player | Wood Type | Shape |
|--------|-----------|-------|
| South (P1) | Teak | Spool |
| West (P2) | Red Cedar | Spool |
| North (P3) | Rosewood | Knob |
| East (P4) | Sandalwood | Bullet |

- Coins start in **carved resting-yard slots** outside the board
- Slots visibly **empty** when a coin enters the track
- Captured coins **fly back** to their original resting slot

### 🎯 Game Modes
| Mode | Players | Description |
|------|---------|-------------|
| **vs AI** | 1 human + 1/2/3 AI | Play solo against computer opponents |
| **Pass & Play** | 2–4 humans | Share one screen, pass device between turns |
| **Online** | 2 players | Generate a room code and share with a friend |

### 🖼️ Visual Design
- **Fixed top-down camera** — clean, classic board game perspective
- **Pulli Kolam floor** — traditional South Indian rice-flour dot kolam beneath the board
- **Minimalist UI** — no clutter; clean player cards with Tamil labels
- Side-panel cowrie dock — always in sight, never in the way
- Subtle toast hints for blocked moves and rule reminders

### 🔊 Procedural Audio
| Event | Sound |
|-------|-------|
| Cowrie roll | Shell rattle |
| Coin placed | Stone clack |
| Capture | Whoosh |
| Crown / Win | Temple bell |

All audio generated via the **Web Audio API** — no sound files needed.

---

## 🗂️ Project Structure

```
chakaram/
├── index.html        — HTML shell: home wizard, game UI overlays
├── styles.css        — Minimalist dark-gold theme, player cards, modals
├── textures.js       — All procedural textures (board, coins, cowries, kolam)
├── scene.js          — Three.js 3D scene builder (board, yards, shells, camera)
├── gameEngine.js     — Full rules engine (turns, moves, captures, bonus rolls)
├── app.js            — Wires scene ↔ engine ↔ UI together
├── audio.js          — Web Audio API procedural sound effects
└── README.md
```

---

## 🧠 How to Play

1. **Launch** the game and choose a mode from the home screen
2. **Select** board size: 5×5 (4 Chozhi) or 7×7 (6 Chozhi)
3. **Roll** the cowrie shells by clicking the Roll button (or the tray in 3D)
4. **Start a coin** only if you rolled a **1 or 5** — click a glowing coin in your resting yard
5. **Move a coin** already on the board by clicking it when it glows
6. **Capture** opponents by landing on their square (safe houses protect them)
7. **Crown all 4 coins** by completing the full track loop — first player to do so wins!

### Scoring Reference (5×5 board, 4 shells)

| Up shells | Down shells | Points | Name | Bonus? |
|-----------|-------------|--------|------|--------|
| 0 | 4 | 8 | Ashta (அஷ்டம்) | ✅ Roll again |
| 1 | 3 | 1 | Daayam (தாயம்) | ✅ Roll again |
| 2 | 2 | 2 | — | ❌ |
| 3 | 1 | 3 | — | ❌ |
| 4 | 0 | 4 | Chowka (சவுக்கா) | ✅ Roll again |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D Rendering | [Three.js r128](https://threejs.org/) |
| Textures | Canvas 2D API (fully procedural) |
| Audio | Web Audio API (fully procedural) |
| Logic | Vanilla JavaScript (ES6 classes) |
| Styling | CSS Custom Properties + Flexbox |
| Fonts | Google Fonts — Cinzel, Noto Sans Tamil |

> **Zero build tools. Zero npm. Zero external assets.**  
> Everything — textures, audio, geometry — is generated at runtime in pure JavaScript.

---

## 🌐 Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome 90+ | ✅ Fully supported |
| Firefox 88+ | ✅ Fully supported |
| Edge 90+ | ✅ Fully supported |
| Safari 14+ | ✅ Fully supported |
| Mobile Chrome | ✅ Supported |

---

## 🗺️ Roadmap

- [ ] Online multiplayer with WebSocket / signaling backend
- [ ] Mobile touch controls and haptic feedback
- [ ] Board and environment theme selector (Settings page)
- [ ] Full Tamil language localization
- [ ] Volume and audio controls
- [ ] Replay / move history viewer
- [ ] Progressive Web App (PWA) — offline installable

---

## 📚 Learn the Rules

New to Chowka Bara? These videos explain it well:

- 📹 [Chowka Bara — How to Play (English)](https://youtu.be/FVnhALWZSBA)
- 📹 [Daayam / Chowka Bara Gameplay](https://youtu.be/w6h-02uKhww)
- 📹 [Katte Mane — Traditional Play](https://youtu.be/-t320mv_XME)

---

## 🙌 Contributing

Pull requests are welcome! If you know regional rule variations of Chowka Bara from your area, please open an issue — they're worth adding.

```bash
# Fork the repository, then:
git checkout -b feature/my-improvement
# Make your changes
git commit -m "feat: describe what you did"
git push origin feature/my-improvement
# Open a Pull Request on GitHub
```

---

## 📜 License

[MIT License](LICENSE) — free to use, modify, and share.

---

## 💛 Why This Exists

Chowka Bara was once played in every South Indian household.  
Today, most people have never heard of it.  
This project exists to change that — one game at a time.

> *"The board remembers what people forget."*

---

<div align="center">

Made with love for Indian cultural heritage 🪷

**[Report a Bug](../../issues)** · **[Request a Feature](../../issues)** · **[Contribute](../../pulls)**

</div>
