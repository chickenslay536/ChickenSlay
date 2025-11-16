# Chicken Slay Game

A chicken catching game with Supabase backend.

## Deployment to Render

1. Fork this repository to your GitHub account
2. Go to [Render](https://render.com) and create an account
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository
5. Set the following:
   - Name: chicken-slay (or any name you prefer)
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Add environment variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_KEY` - Your Supabase anon key
7. Click "Create Web Service"

## Local Development

```bash
npm install
npm start
```

Visit http://localhost:8000 to play the game.