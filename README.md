# Framez

A modern mobile social application built with React Native that allows users to share posts with text and images. Framez demonstrates real-time data handling, secure authentication, and responsive mobile UI/UX.

## 🎯 Project Overview

Framez is a Frontend Stage 4 task showcasing the ability to build a production-ready mobile application with:
- Secure user authentication
- Real-time data synchronization
- Image upload and storage
- Clean, minimal UI design
- Cross-platform support (iOS & Android)

## ✨ Features

### 🔐 Authentication
- **Sign Up**: Create new account with email and password
- **Login**: Secure login with session management
- **Logout**: Safe session termination
- **Persistent Sessions**: Stay logged in after app restart

### 📝 Posts
- **Create Posts**: Share thoughts with text and/or images
- **Image Upload**: Pick images from device gallery
- **Feed Display**: View all posts from all users in chronological order
- **Post Details**: Each post shows author name, avatar, timestamp, and content

### 👤 Profile
- **User Info**: Display current user's name, email, and avatar
- **My Posts**: View all posts created by you
- **Activity**: Track your social activity

### 🎨 Design
- Clean and minimal UI design
- Smooth animations and transitions
- Responsive layout for all screen sizes
- Dark text on light background for readability

## 🛠️ Technology Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Screen navigation and routing
- **Zustand** - Lightweight state management
- **Expo Image Picker** - Image selection functionality

### Backend
- **Convex** - Real-time backend platform
- **Clerk** - Authentication and user management
- **Convex Storage** - Image file storage
- **Convex Database** - Real-time document database

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app on your iOS or Android device (for testing)
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/charlzx/Framez.git
cd Framez
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Convex Backend

```bash
# Install Convex CLI globally
npm install -g convex

# Initialize Convex (follow the prompts)
npx convex dev
```

This will:
- Create a Convex project
- Generate your Convex URL
- Set up the development environment

### 4. Set Up Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Get your **Publishable Key**
4. Configure authentication methods (Email/Password)

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# For Development
CONVEX_DEPLOYMENT=dev:your-dev-deployment
EXPO_PUBLIC_CONVEX_URL=your_convex_deployment_url
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_test_key
```

**For Production**: Use `.env.production` file with production credentials:

```env
# For Production
CONVEX_DEPLOYMENT=prod:your-prod-deployment
EXPO_PUBLIC_CONVEX_URL=your_production_convex_url
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_production_key
```

**Important**: Never commit environment files to version control!

### 6. Start the Development Server

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan the QR code with Expo Go app on your physical device

## 📱 Running on Devices

### iOS Simulator (macOS only)
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Physical Device
1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Run `npm start`
3. Scan the QR code with your device camera (iOS) or Expo Go app (Android)

## 🎨 Design System

### Typography
- **System Fonts**: Space Mono
- **Font Sizes**: 12px, 14px, 16px, 20px, 24px
- **Font Weights**: 400 (Regular), 600 (Semi-Bold), 700 (Bold)

### Spacing
- Base unit: `8px`
- Common values: 8, 16, 24, 32, 40px

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration works with valid email/password
- [ ] Login works with registered credentials
- [ ] Session persists after closing and reopening app
- [ ] Can create post with text only
- [ ] Can create post with image
- [ ] Can create post with both text and image
- [ ] Feed displays all posts correctly
- [ ] Posts show correct author information
- [ ] Timestamps are formatted correctly
- [ ] Profile displays user information
- [ ] Profile shows only user's own posts
- [ ] Logout works and redirects to login
- [ ] App works on both iOS and Android
- [ ] No errors in console
- [ ] Smooth scrolling and navigation

## 📦 Building for Production

### Deploy to Production

#### 1. Deploy Convex Backend to Production
```bash
# Deploy your Convex functions to production
npx convex deploy

# This will output your production URL:
# ✔ Deployed Convex functions to https://your-production-deployment.convex.cloud
```

#### 2. Set Up Production Clerk Instance
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a production instance (or switch to production mode)
3. Get your production publishable key (starts with `pk_live_...`)
4. Update `.env.production` with the production key

#### 3. Build Production App with EAS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

The production build will automatically use the production Convex URL configured in `eas.json`.

## 📚 Key Learnings

This project demonstrates:
- **React Native Development**: Building cross-platform mobile apps
- **State Management**: Managing app-wide state with Zustand
- **Authentication**: Implementing secure auth with Clerk
- **Real-time Data**: Using Convex for live data synchronization
- **File Upload**: Handling image selection and upload
- **UI/UX Design**: Creating clean, intuitive interfaces
- **TypeScript**: Writing type-safe code
- **Mobile Navigation**: Using React Navigation

## 🔧 Troubleshooting

### Common Issues

**Expo won't start**
```bash
# Clear cache and restart
expo start -c
```

**Metro bundler errors**
```bash
# Reset Metro bundler cache
expo start -c
rm -rf node_modules
npm install
```

**Convex connection issues**
- Check your Convex URL in `.env`
- Ensure Convex dev server is running: `npx convex dev`

**Clerk authentication not working**
- Verify Clerk publishable key in `.env`
- Check Clerk dashboard for application status

## 📄 License

This project is created for educational purposes as part of a HNG Frontend Stage 4 assessment.

## 👨‍💻 Author
GitHub: [@charlzx](https://github.com/charlzx)
