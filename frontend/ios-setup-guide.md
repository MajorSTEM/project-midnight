# PROJECT MIDNIGHT — iOS App Store Submission Guide

## Prerequisites

- **Mac with Xcode 15+** — required to build and sign iOS apps. If you are on Windows, see the Windows section at the bottom.
- **Apple Developer Account** — $99/year at [developer.apple.com](https://developer.apple.com). Enroll before starting.
- **Node.js 18+** and npm installed.
- **Backend deployed** — the backend must be live before submitting to the App Store (see backend note at the bottom).

---

## Step 1: Install Dependencies

In the `frontend/` directory, install all packages including the newly added Capacitor packages:

```bash
cd frontend
npm install
```

---

## Step 2: Build and Sync

Build the React app and sync the output into the Capacitor iOS project:

```bash
npm run cap:build
```

This runs `tsc && vite build` to produce `dist/`, then `npx cap sync` to copy assets into the iOS native project and update any Capacitor plugin bridges.

Run this command every time you make frontend changes before testing on device.

---

## Step 3: Add the iOS Platform

This only needs to be done once. It scaffolds the native Xcode project under `ios/`:

```bash
npx cap add ios
```

After this you will have an `ios/` directory containing the full Xcode project.

---

## Step 4: Open in Xcode

```bash
npx cap open ios
```

Or use the convenience script:

```bash
npm run cap:ios
```

This opens `ios/App/App.xcworkspace` in Xcode. Always open the `.xcworkspace` file, not `.xcodeproj`.

---

## Step 5: Configure Code Signing in Xcode

1. In the Project Navigator, select the **App** target.
2. Go to the **Signing & Capabilities** tab.
3. Check **Automatically manage signing**.
4. Set **Team** to your Apple Developer account.
5. Confirm the **Bundle Identifier** is `com.majystem.projectmidnight` — this should already be set from `capacitor.config.ts`.

If you see a "Failed to register bundle ID" error, log into [developer.apple.com](https://developer.apple.com), go to Certificates, Identifiers & Profiles, and manually register the App ID `com.majystem.projectmidnight`.

---

## Step 6: Set App Icons and Launch Screen

### App Icons

1. In Xcode, open `App/App/Assets.xcassets`.
2. Select **AppIcon**.
3. Drag and drop your app icon into each required slot. Apple requires a 1024x1024 PNG for the App Store and various smaller sizes for the device.
4. Use a tool like [appicon.co](https://appicon.co) to generate all sizes from a single 1024x1024 source image.

### Launch Screen

The splash screen is configured in `capacitor.config.ts` with background color `#0a0a0f` (matching the app's dark theme). Capacitor handles the native launch screen automatically. To customize further, edit `App/App/Base.lproj/LaunchScreen.storyboard` in Xcode.

---

## Step 7: Configure Info.plist Permissions

PROJECT MIDNIGHT uses the camera (AR mode) and potentially location. These require permission descriptions in `Info.plist` or Xcode will reject the build.

1. In Xcode, open `App/App/Info.plist`.
2. Add the following keys (right-click > Add Row):

| Key | Value |
|-----|-------|
| `NSCameraUsageDescription` | `PROJECT MIDNIGHT uses the camera to overlay simulation data in AR mode.` |
| `NSLocationWhenInUseUsageDescription` | `PROJECT MIDNIGHT uses your location to center the simulation map.` |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | `PROJECT MIDNIGHT uses your location to center the simulation map.` |

Only include location keys if the app actually requests location permission in code. Camera is required for AR mode.

---

## Step 8: Test on Simulator and Real Device

### Simulator

1. In Xcode, select a simulator (e.g., iPhone 15 Pro) from the device picker.
2. Press **Cmd+R** to build and run.
3. Verify the splash screen, map rendering, and all simulation modes load correctly.

### Real Device

1. Connect your iPhone via USB.
2. Trust the computer on the device if prompted.
3. Select your device from the Xcode device picker.
4. Press **Cmd+R**. First run may require enabling Developer Mode on the device (Settings > Privacy & Security > Developer Mode).
5. Test all simulation modes, AR mode, and network calls to the backend.

---

## Step 9: Archive and Upload to App Store Connect

1. In Xcode, select **Any iOS Device (arm64)** as the destination (not a simulator).
2. From the menu: **Product > Archive**.
3. Wait for the archive to build. The Organizer window will open automatically.
4. Select the archive and click **Distribute App**.
5. Choose **App Store Connect** > **Upload**.
6. Follow the prompts. Xcode will validate and upload the build.

---

## Step 10: Fill Out the App Store Listing

Log into [App Store Connect](https://appstoreconnect.apple.com) and complete the listing:

- **App Name:** PROJECT MIDNIGHT
- **Subtitle:** Global Catastrophe Simulation (30 char max)
- **Description:** Write a compelling description covering all simulation modes (nuclear, pandemic, zombie, asteroid, EMP, geopolitics).
- **Keywords:** simulation, catastrophe, nuclear, pandemic, map, global, disaster
- **Screenshots:** Required for iPhone 6.5" (iPhone 14 Plus / 15 Plus) and 6.7" (iPhone 15 Pro Max). Use the Xcode simulator to capture these. You also need iPad screenshots if you support iPad.
- **App Preview Video:** Optional but recommended.
- **Support URL:** Required — point to your website or GitHub.
- **Privacy Policy URL:** Required for apps that collect user data or use camera/location.
- **Age Rating:** Select **17+**. This app simulates mass-casualty catastrophic events (nuclear strikes, pandemics, zombie outbreaks). During the rating questionnaire, mark "frequent/intense" for simulated violence and mature/suggestive themes to arrive at the 17+ rating.
- **Category:** Games > Simulation, or Education.
- **Price:** Free or paid — set in the Pricing and Availability section.

---

## Step 11: Submit for Review

1. In App Store Connect, go to your app > the build you uploaded.
2. Fill in all required metadata (all red asterisk fields).
3. Click **Add for Review**, then **Submit to App Review**.
4. Apple's review typically takes **24–48 hours** for new apps, sometimes up to a week.
5. You will receive an email when approved or if there are issues to resolve.

Common rejection reasons to avoid:
- Missing privacy policy URL.
- Info.plist missing permission usage descriptions for any API the app accesses.
- App crashes on launch (always test on a real device before submitting).
- Incomplete metadata or placeholder screenshots.

---

## Note for Windows Users

Since you are on Windows, you cannot run Xcode locally. You have two practical options:

### Option A: Codemagic CI/CD (Recommended — Free Tier Available)

[Codemagic](https://codemagic.io) provides Mac build machines in the cloud with Xcode pre-installed. The free tier includes 500 build minutes/month which is enough for App Store submissions.

1. Push your repo to GitHub.
2. Sign up at codemagic.io and connect your repo.
3. Add a `codemagic.yaml` workflow for a Capacitor iOS build.
4. Add your Apple Developer certificates and provisioning profiles as environment variables in Codemagic.
5. Trigger a build — Codemagic will run `npm install`, `npm run cap:build`, `npx cap add ios`, and then archive and upload to App Store Connect.

Codemagic has first-class Capacitor support and sample configs in their docs.

### Option B: MacinCloud

[MacinCloud](https://www.macincloud.com) rents Mac machines by the hour. Connect via Remote Desktop, install Xcode, clone your repo, and do the build manually. Good for one-off submissions.

---

## Backend Deployment Note

The frontend makes API calls to the backend (Node/Express on port 7001). Before submitting to the App Store, deploy the backend so the live app has a working API endpoint.

**Recommended: Render.com (free tier)**

1. Push the backend to GitHub (or it may already be there).
2. Sign up at [render.com](https://render.com).
3. Create a new **Web Service**, connect your repo, set the root directory to `backend/`.
4. Build command: `npm install`
5. Start command: `node index.js` (or whatever your entry point is).
6. Render will give you a URL like `https://gcsp-backend.onrender.com`.
7. Copy that URL into `frontend/.env` as `VITE_API_URL=https://gcsp-backend.onrender.com`.
8. Rebuild the frontend (`npm run cap:build`) so the production bundle points to the live backend.
9. The `frontend/src/utils/apiConfig.ts` utility reads `VITE_API_URL` at build time — make sure the env var is set before building.

Note: Render free tier spins down after 15 minutes of inactivity and has a cold start delay of ~30 seconds. For a production App Store app, consider upgrading to a paid tier or using Railway/Fly.io.
