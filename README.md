# 🌿 AURA Botanicals — Full Stack Website 

LIVE _ https://aura-botanicals.vercel.app/

Premium botanical beverage brand — complete fullstack project.
**No C++ compilation needed. Works on Windows/Mac/Linux.**

## Tech Stack
- **Frontend:** Vanilla HTML + CSS + JS
- **Backend:** Node.js + Express
- **Database:** JSON file via lowdb (zero compilation)

## Project Structure
```
aura-botanicals/
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/main.js
├── server/
│   ├── index.js       ← Express + all API routes
│   └── database.js    ← lowdb JSON database
├── db/                ← auto-created, stores aura.json
├── package.json
└── .gitignore
```

## ▶ Run Locally

```bash
# 1. Install (no compilation needed!)
npm install

# 2. Start server
npm start

# 3. Open browser
# http://localhost:3000
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/products | All products |
| GET | /api/products/:id | Single product |
| GET | /api/cart | Cart items + total |
| POST | /api/cart | Add `{ product_id, quantity }` |
| DELETE | /api/cart/:id | Remove item |
| DELETE | /api/cart | Clear cart |
| POST | /api/newsletter | Subscribe `{ email }` |
| GET | /api/newsletter | All subscribers |
| POST | /api/contact | Message `{ name, email, message }` |
| GET | /api/contact | All messages |
| GET | /api/testimonials | All testimonials |
| GET | /api/ingredients | All ingredients |

## Push to GitHub
```bash
git add .
git commit -m "AURA Botanicals fullstack"
git push
```

---
Made by **Kumar Subodh**
