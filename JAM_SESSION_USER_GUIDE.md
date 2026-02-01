# 🎸 JAM SESSION - USER GUIDE

## 🎵 What is Jam Session?

Jam Session is a **collaborative music listening feature** where multiple people can:
- ✅ Listen to the **same music at the same time** (synchronized playback)
- ✅ **Add songs** to a shared queue
- ✅ **Vote** on songs (upvote/downvote)
- ✅ **Chat** and collaborate in real-time
- ✅ Get **AI song recommendations** based on what's playing

---

## 🚀 HOW TO USE JAM SESSION

### Step 1: Start Your Music Player
1. Double-click **START_MUSIC_PLAYER.bat**
2. Wait for browser to open at http://localhost:3000

### Step 2: Open Jam Session
1. In the music player app, look for the **"Jam Session"** button
2. Click it to enter Jam Session mode

---

## 🎸 CREATE A NEW JAM SESSION (Host)

### As the Host:

1. **Click "Create New Session"** button

2. **Enter Your Name**
   - Example: "John" or "DJ Alex"
   - Max 20 characters

3. **Click "Create Session"**
   - A unique **Session Code** will be generated
   - Example: `ABC123` or `XYZ789`

4. **Share the Session Code** with friends
   - Via text, Discord, WhatsApp, etc.
   - They'll need this code to join!

5. **Add Songs to Queue**
   - Search for songs in the song list
   - Click **"+ Add to Queue"** on any song
   - Songs appear in the shared queue

6. **Control Playback**
   - Click **"▶ Play Next"** to start the queue
   - Songs play automatically one after another
   - Everyone hears the same song at the same time!

7. **Host Powers:**
   - ⏭️ Skip songs
   - 🗑️ Remove songs from queue
   - 👑 Full control over playback

---

## 🎤 JOIN AN EXISTING JAM SESSION (Guest)

### As a Guest/Participant:

1. **Get the Session Code** from the host
   - Example: `ABC123`

2. **Click "Join Existing Session"** button

3. **Enter:**
   - Session Code: `ABC123`
   - Your Name: "Sarah" (max 20 characters)

4. **Click "Join Session"**
   - You'll see the current song playing
   - You'll see other participants
   - You can add songs and vote!

5. **Guest Features:**
   - ➕ Add songs to queue
   - 👍 Upvote songs you like
   - 👎 Downvote songs you don't like
   - 🎵 Hear synchronized playback with everyone

---

## 🎯 JAM SESSION FEATURES

### 1. **Synchronized Playback** 🔄
- Everyone hears the **same song at the same time**
- If host pauses, everyone's music pauses
- If host plays, everyone's music plays
- Perfect sync across all devices!

### 2. **Collaborative Queue** 📋
- **Anyone can add songs**
- Queue is **shared** across all participants
- Songs are **ordered by votes** (highest votes play first)
- See who added each song

### 3. **Voting System** 👍👎
- **Upvote** (👍) songs you want to hear sooner
- **Downvote** (👎) songs you don't like
- Queue **automatically reorders** based on votes
- Popular songs move to the top!

### 4. **Live Participants** 👥
- See everyone in the session
- See who's the host (👑 crown icon)
- Get notifications when people join/leave
- Example: "🎉 Sarah joined the session"

### 5. **AI Recommendations** 🤖
- Click **"Get AI Recommendations"**
- AI analyzes current queue
- Suggests similar songs
- Based on genre, mood, artist, tempo

### 6. **Session Management** ⚙️
- **Session Code:** Share it to invite friends
- **Participant Count:** See how many are listening
- **Auto-play:** Next song plays automatically
- **History:** See recently played songs

---

## 🎮 CONTROLS & BUTTONS

### Host Controls:
| Button | Action |
|--------|--------|
| **▶ Play Next** | Start playing next song in queue |
| **⏸ Pause** | Pause for everyone |
| **⏭️ Skip** | Skip current song |
| **🗑️ Remove** | Remove song from queue |
| **🤖 AI Recs** | Get song recommendations |
| **🚪 Leave** | End session (or assign new host) |

### Guest Controls:
| Button | Action |
|--------|--------|
| **+ Add to Queue** | Add song to shared queue |
| **👍 Upvote** | Vote up a song |
| **👎 Downvote** | Vote down a song |
| **🤖 AI Recs** | Get recommendations |
| **🚪 Leave** | Leave the session |

---

## 📱 EXAMPLE USE CASE

### Scenario: House Party 🎉

**Host (Alex):**
1. Creates session → Gets code: `PARTY22`
2. Shares `PARTY22` with friends
3. Adds first 3 songs to queue
4. Clicks "Play Next" → Music starts!

**Guests join:**
- Sarah enters code `PARTY22` + her name → Joins
- Mike enters code `PARTY22` + his name → Joins
- Lisa enters code `PARTY22` + her name → Joins

**Everyone collaborates:**
- Sarah adds "Uptown Funk"
- Mike upvotes it → Moves up in queue
- Lisa adds "Blinding Lights"
- Alex downvotes a song → Moves down
- AI recommends similar dance tracks
- Everyone enjoys synchronized music! 🎵

---

## 🔧 TECHNICAL DETAILS

### How It Works:
1. **WebSocket Connection** (Socket.IO)
   - Real-time communication between all participants
   - Instant updates for queue changes, votes, playback

2. **Synchronized Timing**
   - All clients play the same audio file
   - Timestamp synchronization ensures perfect sync
   - Host controls propagate to all participants

3. **Session Storage**
   - Session data stored on backend server
   - Unique 6-character session codes
   - Auto-cleanup of inactive sessions

### Requirements:
- ✅ Backend server running (Port 4000)
- ✅ Frontend running (Port 3000)
- ✅ All participants on same network OR internet connection
- ✅ Modern browser (Chrome, Edge, Firefox)

---

## 💡 PRO TIPS

### For Hosts:
1. **Pre-load Queue:** Add 5-10 songs before starting
2. **Mix Genres:** Use AI recommendations for variety
3. **Watch Votes:** Remove heavily downvoted songs
4. **Manage Flow:** Skip songs that don't vibe with the crowd
5. **Share Code Early:** Get people joining before party starts

### For Guests:
1. **Vote Wisely:** Upvote songs you genuinely like
2. **Add Variety:** Don't just add your favorite artist
3. **Check Queue:** See what's already added before duplicating
4. **Respect Host:** They have final say on skips/removes
5. **Suggest via Chat:** Propose song ideas to others

---

## ❓ TROUBLESHOOTING

### "Session not found"
- **Check session code** - Must be exact (case-sensitive)
- **Host must create session first**
- **Session may have expired** (inactive for too long)

### Music not synchronized
- **Refresh browser** (F5)
- **Check internet connection**
- **Host should pause → play to resync everyone**

### Can't add songs
- **Queue might be full** (50 song limit)
- **Check if you're connected** (participant list should show you)

### Lost connection
- **Rejoin using same code and name**
- **You'll resume from current song**

---

## 🎊 HAVE FUN JAMMING TOGETHER!

Jam Session turns music into a **social experience**. Perfect for:
- 🎉 House parties
- 🎮 Gaming sessions
- 💼 Office hangouts  
- 🏠 Remote listening parties
- 🎂 Virtual celebrations

**Create your session and start vibing! 🎵**
