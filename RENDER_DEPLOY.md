# Planning Poker - Render Deployment Guide

## 🚀 Deploying to Render

This Planning Poker application is optimized for deployment on Render, which provides excellent support for Socket.IO and persistent connections.

### Quick Deploy

1. **Connect your GitHub repository to Render**
2. **Use the following settings:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node.js
   - **Plan:** Free (or higher for production)

### Environment Variables

No special environment variables are required for basic functionality. The app will automatically detect the Render environment.

### Features

- ✅ Real-time Socket.IO connections
- ✅ Persistent server for stable WebSocket connections
- ✅ Automatic scaling support
- ✅ Free tier compatible

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Socket.IO Configuration

The app is configured to work optimally on Render with:
- WebSocket and polling transport fallback
- Optimized connection timeouts
- CORS enabled for cross-origin access
- Automatic reconnection handling

### Architecture

- **Frontend:** Next.js 15 with React 19
- **Backend:** Next.js API Routes with Socket.IO
- **Real-time:** Socket.IO for bidirectional communication
- **State Management:** React hooks with session storage persistence

### Vercel Note

While this app can be deployed to Vercel, Socket.IO functionality is limited due to serverless architecture. For full real-time features, Render (or similar platforms with persistent servers) is recommended.
