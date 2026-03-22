# Scarlet Slinger - Phase 1 Prototype

A web-shooter VR prototype designed for the Meta Quest 3, built completely in the browser using Three.js, WebXR Hands API, and Handy.js.

In Phase 1, you can drop your controllers, raise your hands, instantiate web shooters to your wrists by pinching, fire "webs" to grab spatial target cans, pull them towards you, and reload ammunition by physically bringing cartridges near your shooters.

## Tech Stack
- **Three.js (r160)** for WebGL 3D rendering.
- **WebXR Hands API** for controller-less hand tracking.
- **Handy.js** for real-time skeletal pose recognition ("Spidey squeeze", pinch, fist mode-switch).
- **Vite** for the development server and fast bundling.

---

## Local Development (Testing on Quest 3)

WebXR requires a secure context (HTTPS). This project uses Vite's `basic-ssl` plugin to instantly generate local HTTPS certificates so your Meta Quest browser easily permits hand tracking.

### 1. Install Dependencies
Make sure you have Node.js installed on your computer. Note that we are using a git remote module for `handy.js`.

```bash
npm install
```

### 2. Start the Secure Dev Server
```bash
npm run dev
```

### 3. Open in Meta Quest 3
- Ensure your computer and your Meta Quest 3 are on the **same Wi-Fi network**.
- Once the server is running, the terminal will display a "Network" address. It will look something like this:
  `➜  Network: https://192.168.1.XX:5173/`
- Put on your headset, open the **Meta Quest Browser**, and manually type that exact secure URL. (You may need to bypass the browser's "Not Secure" self-signed certificate warning by clicking Advanced -> Proceed).

---

## Remote Deployment (Vercel)

Vercel makes hosting static Vite applications effortless.

### 1. Push to GitHub
Commit your project folder to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit for Phase 1 Prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/scarlet-slinger.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
2. Select the GitHub repository you just pushed.
3. In the *"Build and Output Settings"*, Vercel will automatically detect that you're using Vite. Make sure the settings are:
   - **Framework Preset**: Vite
   - **Build Command**: `vite build` (or `npm run build`)
   - **Output Directory**: `dist`
4. Click **Deploy**.

Because Vercel automatically deploys over HTTPS, WebXR features (including hand-tracking logic) are served natively and securely.

---

## How to Play (Quest 3 Instructions)

**Before you start:** Go to your Quest 3 system settings -> Movement Tracking -> Hand Tracking, and make sure **Hand Tracking is enabled**.

1. Load your local Network IP or your live Vercel URL in the Quest Browser.
2. Put down your controllers entirely. Point at the overlay and use your bare hand to click the **Enter VR** button.
3. Look at the virtual desk in front of you.

### Controls:
- **Equip Shooter**: Look at one of the Web Shooters on the desk. Using your hand, bring your thumb and index finger close together (a precise pinch) within proximity of the shooter. It will attach to your wrist automatically.
- **Shoot Web**: With your shooter equipped, perform the **Fire Pose** (index finger extended forward, middle/ring/pinky mostly curled, and tap thumb downward towards middle finger) aiming at a target can. This will shoot a raycast web line that retracts, pulling the target backwards towards your hand!
- **Mode Switch**: Clench your hand into a **Fist pose** (all fingers and thumb tightly contracted inwards) to cycle your shooter into different modes. The color visualizer will shift to represent your active payload.
- **Reloading**: Once you hit 0 ammo, your shooter will flash red and deny firing. With your *other* free hand (or free fingers), pinch a cylindrical cartridge from the table and physically move it towards the empty shooter on your wrist. The shooter's reserves will reset automatically and the cartridge disappears!

Check the overlay console at your waist-level for live debugging outputs across all interaction states.
