# Impossible Tasks - PRD

## Original Problem Statement
Build a mobile-first, full-screen web application inspired by TikTok but focused entirely on "impossible tasks" — tasks that appear extremely simple at first glance but are secretly brutal to complete. TikTok-style vertical swipe navigation, live global completion rates, auto-restart on failure, and viral sharing features.

## User Personas
- **Casual Mobile Gamers**: Users seeking quick, addictive micro-challenges during short breaks
- **TikTok Demographic**: Short attention span users who enjoy frustration-driven replay
- **Viral Content Sharers**: Users who love sharing "impossible" challenges with friends
- **Competitive Players**: Users who want to beat low completion rates

## Core Requirements (Static)
1. ✅ Mobile-first, full-screen experience
2. ✅ TikTok-style vertical swipe navigation
3. ✅ Live global completion rate tracking
4. ✅ Attempt counter per task
5. ✅ Auto-restart on failure (no confirmation dialogs)
6. ✅ 10-15 diverse task types
7. ✅ Native share dialog + copy link
8. ✅ Subtle sound effects
9. ✅ Clean, deceptive, minimalist UI
10. ✅ Deep link support for viral sharing

## Architecture
- **Frontend**: React 19 + Framer Motion (swipe animations) + Tailwind CSS
- **Backend**: FastAPI (Python) with async MongoDB (Motor)
- **Database**: MongoDB for stats tracking (attempts, completions, completion rates)
- **Sound**: Web Audio API for subtle feedback sounds

## What's Been Implemented (Jan 2026)

### Backend
- Task definitions (12 unique tasks)
- Stats tracking API (attempts, completions, completion rates)
- Real-time stats calculation
- Leaderboard endpoint

### Frontend
- TaskContainer with TikTok-style swipe navigation
- 12 Task Components:
  1. **Hold** - Hold button for exactly 3.000s (±20ms tolerance)
  2. **Still** - Tap when circle stops moving (subtle animation)
  3. **Catch** - Drag dot into shrinking circle
  4. **Tap 50** - Tap 50 times with one random trap tap
  5. **Balance** - Balance shape for 5 seconds
  6. **Read** - Misleading "tap the blue button" puzzle
  7. **Wait** - Wait unknown duration without touching
  8. **Sync** - Tap when two shapes align
  9. **React** - Reaction time challenge (200ms window)
  10. **Quick** - Hesitation fails task (500ms limit)
  11. **Exact** - Precision slider to exact value
  12. **Speed** - Rapid tap 10 times in 2 seconds
- StatsOverlay (pass rate, attempts, global stats)
- ShareDialog with native share + copy link
- Deep link routing (/task/:taskId)
- Sound effects (click, fail, success, tick)

## P0/P1/P2 Features Remaining

### P0 (Critical)
- All core features implemented ✅

### P1 (Important)
- Task difficulty adjustment based on global completion rates
- Daily challenges / featured task
- Streak counter for consecutive completions

### P2 (Nice to Have)
- Haptic feedback on mobile
- Achievement badges
- Personal best tracking per task
- Leaderboard UI
- Social login for persistent stats

## Next Action Items
1. Add more task variations for increased replay value
2. Implement haptic feedback for mobile devices
3. Add achievement system for completing multiple tasks
4. Consider adding a daily challenge feature
5. Implement personal best tracking with optional authentication
