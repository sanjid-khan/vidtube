# VidTube 🎬

A YouTube-like backend REST API built with Node.js, Express, and MongoDB.

---

## 🛠️ Tech Stack

- **Runtime** — Node.js
- **Framework** — Express.js
- **Database** — MongoDB + Mongoose
- **Authentication** — JWT (Access & Refresh Token)
- **File Storage** — Cloudinary + Multer
- **Password Hashing** — Bcrypt

---

## 🚀 Features

- JWT based authentication with HTTP-only cookies
- Video upload, update, delete and publish toggle
- Comment, Like and Tweet system
- Channel subscription system
- Playlist management
- Watch history tracking
- Channel dashboard with stats
- Pagination on all list endpoints

---

## ⚙️ Setup

**1. Clone & Install**
```bash
git clone https://github.com/sanjid-khan/vidtube.git
cd vidtube
npm install
```

**2. Environment Variables**
```bash
cp .env.sample .env
```

```env
PORT=8000
MONGODB_URI=your_mongodb_uri
CORS_ORIGIN=http://localhost:3000

ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

NODE_ENV=development
```

**3. Run**
```bash
# Development
npm run dev

# Production
npm start
```

---

## 📡 API Endpoints

### 👤 Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/users/register` | Register new user with avatar & cover image | ❌ |
| POST | `/api/v1/users/login` | Login with email or username | ❌ |
| POST | `/api/v1/users/logout` | Logout and clear cookies | ✅ |
| POST | `/api/v1/users/refresh-token` | Refresh access token | ❌ |
| GET | `/api/v1/users/current-user` | Get logged in user details | ✅ |
| POST | `/api/v1/users/change-password` | Change current password | ✅ |
| PATCH | `/api/v1/users/update-account` | Update fullname and email | ✅ |
| PATCH | `/api/v1/users/avatar` | Update profile avatar | ✅ |
| PATCH | `/api/v1/users/cover-image` | Update cover image | ✅ |
| GET | `/api/v1/users/c/:username` | Get channel profile with subscriber count | ✅ |
| GET | `/api/v1/users/history` | Get watch history with video details | ✅ |

### 🎥 Videos
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/videos` | Get all videos with search, sort & pagination | ✅ |
| POST | `/api/v1/videos` | Upload new video with thumbnail | ✅ |
| GET | `/api/v1/videos/:videoId` | Get video by ID with likes & owner details | ✅ |
| PATCH | `/api/v1/videos/:videoId` | Update video title, description & thumbnail | ✅ |
| DELETE | `/api/v1/videos/:videoId` | Delete video and remove from Cloudinary | ✅ |
| PATCH | `/api/v1/videos/toggle/publish/:videoId` | Toggle video publish status | ✅ |

### 💬 Comments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/comments/:videoId` | Get all comments on a video with pagination | ✅ |
| POST | `/api/v1/comments/:videoId` | Add a comment on a video | ✅ |
| PATCH | `/api/v1/comments/c/:commentId` | Update a comment | ✅ |
| DELETE | `/api/v1/comments/c/:commentId` | Delete a comment | ✅ |

### ❤️ Likes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/likes/toggle/v/:videoId` | Toggle like on a video | ✅ |
| POST | `/api/v1/likes/toggle/c/:commentId` | Toggle like on a comment | ✅ |
| POST | `/api/v1/likes/toggle/t/:tweetId` | Toggle like on a tweet | ✅ |
| GET | `/api/v1/likes/videos` | Get all liked videos with pagination | ✅ |

### 🐦 Tweets
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/tweets` | Create a new tweet | ✅ |
| GET | `/api/v1/tweets/user/:userId` | Get all tweets by a user with pagination | ✅ |
| PATCH | `/api/v1/tweets/:tweetId` | Update a tweet | ✅ |
| DELETE | `/api/v1/tweets/:tweetId` | Delete a tweet | ✅ |

### 📋 Playlists
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/playlists` | Create a new playlist | ✅ |
| GET | `/api/v1/playlists/:playlistId` | Get playlist by ID with video details | ✅ |
| PATCH | `/api/v1/playlists/:playlistId` | Update playlist name & description | ✅ |
| DELETE | `/api/v1/playlists/:playlistId` | Delete a playlist | ✅ |
| PATCH | `/api/v1/playlists/add/:videoId/:playlistId` | Add video to playlist | ✅ |
| PATCH | `/api/v1/playlists/remove/:videoId/:playlistId` | Remove video from playlist | ✅ |
| GET | `/api/v1/playlists/user/:userId` | Get all playlists of a user | ✅ |

### 🔔 Subscriptions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/subscriptions/c/:channelId` | Subscribe or unsubscribe a channel | ✅ |
| GET | `/api/v1/subscriptions/c/:channelId` | Get all subscribers of a channel | ✅ |
| GET | `/api/v1/subscriptions/u/:subscriberId` | Get all channels subscribed by a user | ✅ |

### 📊 Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/dashboard/stats` | Get channel stats — views, likes, subscribers, videos | ✅ |
| GET | `/api/v1/dashboard/videos` | Get all videos of a channel with likes & comments count | ✅ |

---

## 👨‍💻 Author

**Sanjid Khan**
[GitHub](https://github.com/sanjid-khan)

---

## 📄 License

MIT