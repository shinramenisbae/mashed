# Mashed - Game Flow Documentation

## Overview

**Mashed** is an online party game where the humor comes from the disconnect between what one player hears and how another player interprets it. The asymmetric gameplay creates unexpected, hilarious moments as players try to match absurd sounds with the perfect GIF and caption.

**Player Count:** 4-8 players  
**Round Duration:** ~3-4 minutes per round  
**Game Duration:** 15-25 minutes (4-6 rounds recommended)

---

## Core Game Loop

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    LOBBY    │───▶│  RECORDING  │───▶│   MATCHING  │───▶│  CAPTIONING │
│  (Join/Wait)│    │ (Sound Makers│    │(GIF Selectors│    │ (Caption +  │
│             │    │  Record)    │    │  Assigned)  │    │   Review)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                  │
                                                                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GAME END  │◀───│   SCORING   │◀───│   VOTING    │◀───│   RESULTS   │
│ (Final Stand│    │ (Points +   │    │ (All Players│    │  (Reveal +  │
│   Winner)   │    │   Bonuses)  │    │    Vote)    │    │   Laughs)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Phase 1: Lobby

**Duration:** Variable (host-controlled)

### Flow
1. **Host creates room** → receives 6-character room code
2. **Players join** via room code or invite link
3. **Players set nickname** and optional avatar (emoji)
4. **Host configures game settings:**
   - Number of rounds (4-10, default 5)
   - Recording time limit (15-60 seconds, default 30s)
   - Caption time limit (45-120 seconds, default 60s)
   - Voting time limit (30-90 seconds, default 45s)
   - Points for winner (default 100)
   - Bonus points enabled (yes/no)

### Player States
- `waiting` - In lobby, ready to play
- `ready` - Clicked ready button
- Game starts when all players marked ready AND minimum 4 players

### Fun Moment: Pre-Game Banter
Players can send quick reactions/emoji in lobby chat to build hype before starting.

---

## Phase 2: Recording

**Duration:** 30 seconds per sound maker + 10s buffer

### Flow
1. **Random assignment:** 50% of players (rounded up) become **Sound Makers**
   - 4 players → 2 Sound Makers
   - 5 players → 3 Sound Makers.
   - 6 players → 3 Sound Makers
   - 7 players → 4 Sound Makers
   - 8 players → 4 Sound Makers

2. **Sound Makers see:** "Make a sound!" prompt with countdown timer
   - Can be ANY sound: voice, mouth sounds, beatboxing, impressions, nonsense words
   - Real-time audio waveform visualization
   - Tap to record, tap to stop (can re-record until time expires)

3. **GIF Selectors see:** "Listen carefully..." waiting screen
   - Shows which Sound Makers are recording
   - Fun facts/tips rotate during wait

### Recording Constraints
- Minimum 3 seconds, maximum 30 seconds
- Must record something (can't be silent)
- Auto-normalized audio levels

### Fun Moment: The Pressure
Sound Makers have limited time to create something absurd. The panic of "what sound do I make?!" often produces the best content.

---

## Phase 3: Matching (Assignment)

**Duration:** Instant (server-side)

### Flow
1. **Algorithm assigns** each Sound Maker's audio to a unique GIF Selector
2. **Rotation logic:** Players won't get the same pairing twice in a game
3. **Distribution is random** but balanced (everyone makes sounds, everyone selects GIFs over the course of the game)

### Assignment Rules
- No player matches their own sound
- Spread assignments as evenly as possible
- Track history to avoid repeats

### Example (6 players, 3 sounds):
```
Sound Makers: Alice, Bob, Charlie
Assigned to:   Dana, Edgar, Fiona (respectively)
```

---

## Phase 4: Captioning

**Duration:** 60 seconds per GIF Selector

### Flow
1. **GIF Selectors hear** their assigned sound (autoplay once, can replay)
2. **Search and select GIF** from Giphy/Tenor integration
   - Search bar with autocomplete suggestions
   - Grid of trending GIFs below search
   - Tap to preview, tap again to select
   - Selected GIF appears in confirmation area

3. **Write caption** to match the sound
   - Text input with 140 character limit
   - Real-time preview: GIF + caption combined
   - Can edit both until time expires

4. **Submit** (or auto-submit when timer expires)

### Caption Guidelines (shown to players)
- Be unhinged. Be unserious. Be main character.
- Can describe what's "happening" in the sound
- Can quote imagined dialogue
- Can add context or reactions
- The more cursed, the better!
- Think: "what would make this go viral on TikTok?"

**Example vibes:**
- "POV: you check your bank account after the weekend"
- "Me pretending I have my life together"
- "When the 'be there in 5' was 45 mins ago"
- "Nobody: / Me at 3am:"

### Fun Moment: The Interpretation Gap
The magic happens when a Sound Maker's "angry cat meow" becomes a GIF of someone reacting to bad news with the caption "when you check your bank account on Monday morning."

---

## Phase 5: Results (The Reveal)

**Duration:** ~2-3 minutes (variable based on player count)

### Flow
1. **All submissions revealed sequentially** (random order)
2. **Each reveal shows:**
   - Original sound (play button, auto-plays)
   - Selected GIF (loops)
   - Caption text (typewriter animation)
   - Anonymous labels: "Sound Maker #1", "GIF Selector #1"

3. **Players react** with emoji reactions (laughing, mind-blown, fire, etc.)
4. **Sound Maker revealed** after voting for that round completes

### Reveal Format
```
┌─────────────────────────────────────────┐
│  🔊 [Play Sound: "BLEARGH-BLOOP-WHISTLE"]│
│                                         │
│  ┌─────────────────────────────────┐    │
│  │         [GIF PLAYER]            │    │
│  │    (seal clapping vigorously)   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  "When the meeting could've been an     │
│   email but you already showered"       │
│                                         │
│  ~Anonymous GIF Selector                │
└─────────────────────────────────────────┘
```

### Fun Moment: The Reveal
The collective reaction when everyone realizes the "epic movie trailer voice" was actually someone making mouth sounds into their phone.

---

## Phase 6: Voting

**Duration:** 45 seconds per round of submissions

### Flow
1. **Each player votes** for their favorite submission (can't vote for their own)
2. **Voting options:**
   - 1 vote per player per round
   - Tapping submission highlights it
   - Can change vote until timer expires

3. **Bonus votes available:**
   - "Best Unhinged Interpretation" - vote for the most unhinged, unserious mismatch
   - "I'm Dead 💀" - vote for what made you cry laugh
   - "Main Character Energy" - vote for the most unnecessarily dramatic take
   - "Gaslight Gatekeep Girlboss" - vote for the most unhinged caption that somehow works
   - (Host can enable/disable bonus categories)

### Scoring Points
- **Standard vote:** 50 points per vote received
- **Most votes in round:** +100 bonus
- **Sound Maker vote:** 25 points (if you made the sound that won)
- **Participation:** 10 points for submitting

---

## Phase 7: Scoring

**Duration:** 15 seconds

### Flow
1. **Scoreboard updates** with animation
2. **Round highlights:**
   - Winner of the round
   - Most creative caption
   - Best audio (most votes as Sound Maker)

3. **Progress check:**
   - Show current round / total rounds
   - Remind players of rotation ("Next round: You'll be making sounds!")

### Scoring Animation
```
Alice:    450 ▲ +150  🔥 1st
Bob:      380 ▲ +120     2nd
Charlie:  320 ▲ +80      3rd
Dana:     290 ▲ +95      4th
```

---

## Phase 8: Game End

**Duration:** Variable (host can start new game)

### Flow
1. **Final standings displayed** with podium animation
2. **Awards ceremony:**
   - 🏆 Bestie Champion (most points)
   - 🎭 Main Character Syndrome (most votes as Sound Maker)
   - 🎨 Unhinged Interpretation King/Queen (most "Best Unhinged Interpretation" votes)
   - 😂 I'm Dead 💀 Award (most "I'm Dead 💀" votes)
   - ✨ Gaslight Gatekeep Girlboss (most chaotic energy votes)
   - 📉 Sold (worst take, participation award)

3. **Game stats:**
   - Total sounds created
   - Total GIFs used
   - Most popular search term
   - Longest caption
   - Funniest sound (most reactions)

4. **Options:**
   - Play again (same room)
   - Return to lobby (new settings)
   - Share results (image generation for social)

---

## Timing Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Lobby | Variable | Variable |
| Recording | 40s | 40s |
| Matching | Instant | 40s |
| Captioning | 70s | 110s |
| Results Reveal | 180s | 290s (4.8 min) |
| Voting | 45s | 335s (5.6 min) |
| Scoring | 15s | 350s (~6 min) |

**Per Round:** ~6 minutes  
**Full Game (5 rounds):** ~30 minutes

---

## Why This Works (The Fun Loop)

1. **Creative Expression** - Sound Makers can be anyone/anything
2. **Interpretive Freedom** - GIF Selectors have no "wrong" answer
3. **Surprise Reveals** - Nobody knows who made what until voting
4. **Low Stakes** - Participation points ensure everyone progresses
5. **Social Bonding** - Inside jokes emerge naturally
6. **Accessibility** - No artistic skill required, just humor and creativity

## Edge Cases Handled

- **Player disconnects mid-game:** AI bot fills in with random selections, or round restarts if early
- **Audio upload fails:** Prompt to re-record with 10s extension
- **GIF API fails:** Fallback to cached trending GIFs
- **Tie in voting:** Both players receive full bonus points
- **Not enough players:** Minimum 4 required, game waits in lobby
