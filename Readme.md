# VidTube API Server 🎬

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

> A robust, production-ready backend REST API for a YouTube-like video-sharing platform built with modern Node.js best practices, JWT authentication, MongoDB Aggregation Pipelines, and Cloudinary media management.

---

## 🌐 Live Server & Status

| Environment | URL | Status |
| :--- | :--- | :---: |
| **Production API Base** | https://vidtubebackend.vercel.app | 🟢 Live |
| **Health Check Endpoint** | https://vidtubebackend.vercel.app/api/v1/healthcheck | 🟢 200 OK |

---

## 🛠 Tech Stack & Core Libraries

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database & ODM:** MongoDB Atlas + Mongoose
- **Authentication:** JWT (Access & Refresh Tokens) with HttpOnly Cookies
- **Media Management:** Multer (Temporary Disk Storage) + Cloudinary SDK
- **Security:** BcryptJS (Password Hashing) & CORS Management

---

## ✨ Features Overview

| Feature Category | Description |
| :--- | :--- |
| **Authentication** | Secure Register, Login, Refresh Token Rotation, and Logout |
| **User Profile** | Update Details, Avatar & Cover Image Uploads, Watch History, Public Profile |
| **Video Engine** | Upload Video/Thumbnail, Toggle Publish, Dynamic Search, Sorting & Pagination |
| **Social Engagements** | Likes (Video/Comment/Tweet), Comments, Community Tweets, Subscriptions |
| **Playlists** | Create/Update/Delete Playlists, Add/Remove Videos |
| **Creator Dashboard** | Real-time Analytics (Total Views, Likes, Subscribers, and Uploaded Videos) |

---

## 📂 Project Structure

```text
vidtube/
├── public/
│   └── temp/                 # Temporary storage for uploads before Cloudinary sync
├── src/
│   ├── controllers/          # Business logic handlers for API routes
│   ├── db/                   # MongoDB database connection setup
│   ├── middleware/           # Auth, Multer, Error handling middlewares
│   ├── models/               # Mongoose schemas & data models
│   ├── routes/               # API endpoint route definitions
│   ├── utils/                # ApiError, ApiResponse, AsyncHandler, Cloudinary helpers
│   ├── app.js                # Express app config & middleware integration
│   └── index.js              # Server entry point
├── .env.sample               # Environment variables template
├── vercel.json               # Deployment configuration for Vercel
└── package.json
```

---

## ⚙️ Local Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/sanjid-khan/vidtube.git

cd vidtube

npm install
```

### 2. Environment Setup

Create a `.env` file in the project root directory and add your credentials:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

NODE_ENV=development
```

### 3. Run Server

```bash
# Start development mode (Nodemon)
npm run dev

# Start production mode
npm start
```

---

## 📡 Complete API Route Documentation

### 🏥 System Health Check

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/v1/healthcheck` | Verify API server status and response time | ❌ |

---

### 👤 User Authentication & Profile

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| **POST** | `/api/v1/users/register` | Register user with profile avatar & cover image | ❌ |
| **POST** | `/api/v1/users/login` | Login using email or username | ❌ |
| **POST** | `/api/v1/users/logout` | Revoke session cookies and active refresh token | ✅ |
| **POST** | `/api/v1/users/refresh-token` | Generate new Access Token via Refresh Token | ❌ |
| **GET** | `/api/v1/users/current-user` | Get logged-in user profile details | ✅ |
| **POST** | `/api/v1/users/change-password` | Update user password | ✅ |
| **PATCH** | `/api/v1/users/update-account` | Update account full name and email | ✅ |
| **PATCH** | `/api/v1/users/avatar` | Update avatar image on Cloudinary | ✅ |
| **PATCH** | `/api/v1/users/cover-image` | Update channel cover image | ✅ |
| **GET** | `/api/v1/users/c/:username` | Fetch public channel profile with subscriber count | ✅ |
| **GET** | `/api/v1/users/history` | Retrieve watch history with populated video refs | ✅ |

---

### 🎥 Videos

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/v1/videos` | Fetch all videos with search, filter & pagination | ✅ |
| **POST** | `/api/v1/videos` | Upload new video & thumbnail to Cloudinary | ✅ |
| **GET** | `/api/v1/videos/:videoId` | Get video by ID and increment view count | ✅ |
| **PATCH** | `/api/v1/videos/:videoId` | Update video title, description, or thumbnail | ✅ |
| **DELETE** | `/api/v1/videos/:videoId` | Delete video asset from Cloudinary & DB | ✅ |
| **PATCH** | `/api/v1/videos/toggle/publish/:videoId` | Toggle video public/private status | ✅ |

---


### 💬 Comments & Likes

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/v1/comments/:videoId` | Get paginated comments for a video | ✅ |
| **POST** | `/api/v1/comments/:videoId` | Post a comment on a video | ✅ |
| **PATCH** | `/api/v1/comments/c/:commentId` | Update a comment | ✅ |
| **DELETE** | `/api/v1/comments/c/:commentId` | Delete a comment | ✅ |
| **POST** | `/api/v1/likes/toggle/v/:videoId` | Toggle like status on a video | ✅ |
| **POST** | `/api/v1/likes/toggle/c/:commentId` | Toggle like status on a comment | ✅ |
| **POST** | `/api/v1/likes/toggle/t/:tweetId` | Toggle like status on a tweet | ✅ |
| **GET** | `/api/v1/likes/videos` | Fetch all liked videos of the active user | ✅ |

---

### 📋 Playlists & Subscriptions

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| **POST** | `/api/v1/playlists` | Create a new playlist | ✅ |
| **GET** | `/api/v1/playlists/:playlistId` | Get playlist details with video list | ✅ |
| **PATCH** | `/api/v1/playlists/:playlistId` | Update playlist name and description | ✅ |
| **DELETE** | `/api/v1/playlists/:playlistId` | Delete a playlist | ✅ |
| **PATCH** | `/api/v1/playlists/add/:videoId/:playlistId` | Add video to playlist | ✅ |
| **PATCH** | `/api/v1/playlists/remove/:videoId/:playlistId` | Remove video from playlist | ✅ |
| **POST** | `/api/v1/subscriptions/c/:channelId` | Subscribe/Unsubscribe to a channel | ✅ |
| **GET** | `/api/v1/subscriptions/c/:channelId` | Get all subscribers of a channel | ✅ |
| **GET** | `/api/v1/subscriptions/u/:subscriberId` | Get all channels subscribed by a user | ✅ |

---

### 📊 Dashboard & Tweets

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/v1/dashboard/stats` | Channel stats (Total views, likes, subs, videos) | ✅ |
| **GET** | `/api/v1/dashboard/videos` | Get all videos uploaded by the channel owner | ✅ |
| **POST** | `/api/v1/tweets` | Publish a community tweet | ✅ |
| **GET** | `/api/v1/tweets/user/:userId` | Get user community tweets | ✅ |
| **PATCH** | `/api/v1/tweets/:tweetId` | Edit tweet text | ✅ |
| **DELETE** | `/api/v1/tweets/:tweetId` | Delete community tweet | ✅ |

---

## 👨‍💻 Author

**Sanjid Khan**

- GitHub: [@sanjid-khan](https://github.com/sanjid-khan)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.