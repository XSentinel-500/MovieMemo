# MovieMemo 🎬

Your personal AI-powered movie intelligence agent. Discover iconic soundtracks, explore real filming locations, and uncover hidden easter eggs in your favorite films.

## ✨ Features

### Free Endpoints
- **Movie Info** - Get detailed movie information including director, cast, ratings, and box office data
- **Actor Stats** - Discover an actor's filmography with average ratings, highest-rated movie, and top 3 films
- **Director Stats** - Analyze a director's complete works with ratings analysis and top recommendations

### Paid Endpoints (x402 micropayments - 0.01 USDC)
- **Soundtrack List** - Complete OST with YouTube Music links and scene timestamps
- **Filming Locations** - Real-world filming locations with Google Maps integration
- **Easter Egg Guide** - Hidden references, cameos, and production trivia revealed by AI

## 🚀 Live Demo

Access the agent at: **https://moviememo-production.up.railway.app**

### Example Usage

```bash
# Free: Get movie information
curl -X POST 'https://moviememo-production.up.railway.app/entrypoints/movie-info/invoke' \
  -H 'Content-Type: application/json' \
  -d '{"input":{"movieTitle":"Inception"}}'

# Free: Get actor statistics
curl -X POST 'https://moviememo-production.up.railway.app/entrypoints/actor-stats/invoke' \
  -H 'Content-Type: application/json' \
  -d '{"input":{"actorName":"Christopher Nolan"}}'

# Paid: Get soundtrack (x402 payment required)
curl -X POST 'https://moviememo-production.up.railway.app/entrypoints/soundtrack-list/invoke' \
  -H 'Content-Type: application/json' \
  -d '{"input":{"movieTitle":"Inception"}}'
```

## 💰 Pricing

All paid endpoints require **0.01 USDC** via x402 payment protocol on Base network.

## 🛠 Tech Stack

- **Lucid Agents SDK** - Agent framework
- **x402 Protocol** - Micropayments for AI services
- **TMDB API** - Movie and cast information
- **MiniMax LLM** - AI-powered content generation
- **YouTube Music** - Music discovery
- **Google Maps** - Location data

## 📡 Endpoints

| Endpoint | Type | Price |
|----------|------|-------|
| `/entrypoints/movie-info/invoke` | Free | - |
| `/entrypoints/actor-stats/invoke` | Free | - |
| `/entrypoints/director-stats/invoke` | Free | - |
| `/entrypoints/soundtrack-list/invoke` | Paid | 0.01 USDC |
| `/entrypoints/filming-location/invoke` | Paid | 0.01 USDC |
| `/entrypoints/easter-egg-guide/invoke` | Paid | 0.01 USDC |

## 🎯 Use Cases

- **Film Students** - Research filming techniques and locations
- **Movie Fans** - Discover hidden details and trivia
- **Content Creators** - Find soundtrack clips and scene references
- **Travelers** - Visit real movie filming locations

## 🔒 Security

- x402 payments ensure verifiable, trustless transactions
- No account required - pay per request
- All payments settled on Base blockchain

---

*Built with 🤖 by XSentinel-500*
