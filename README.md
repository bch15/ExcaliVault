# ExcaliVault 📐

**ExcaliVault** is a powerful, privacy-focused browser extension designed to enhance your [Excalidraw](https://excalidraw.com) workflow. It acts as a secure vault for your creativity, providing auto-saving, a local library system, and seamless file management directly within the interface.

![ExcaliVault Banner](assets/banner.png)

## ✨ Key Features

### 💾 Smart Auto-Save
Never lose your work again. ExcaliVault automatically saves your progress in the background every 20 seconds.
- **Visual Feedback**: A subtle indicator shows you exactly when your work is saved.
- **Unsaved Changes Warning**: Prevents accidental tab closures if you have unsaved work.

### 📚 Local Library System
A built-in file manager right inside Excalidraw.
- **Side Drawer**: Access all your saved drawings without leaving the canvas.
- **Preview Thumbnails**: See a preview of your drawings before opening them.
- **One-Click Load**: Switch between projects instantly.
- **Manage**: Delete old or unwanted drawings easily.

### ⚡ Enhanced Workflow
- **Quick Save (Ctrl+S)**: Optimized to work seamlessly with Persian/English keyboard layouts.
- **Smart Loading**: Load `.excalidraw` files and see them instantly (fixes the native reload issue).
- **New Canvas**: Quickly start a fresh project with the "New" button.
- **Persian Calendar**: Files are saved with organized Persian dates (e.g., `14030914_MyDrawing`).

### 🎨 Modern & Minimal UI
- **Glassmorphism Design**: Beautiful, translucent buttons that blend into the workspace.
- **RTL Support**: Fully localized interface for Persian users.
- **Non-Intrusive**: Minimalist toolbar that doesn't clutter your canvas.

---

## 🛠️ Installation & Development

Ensure you have **Node.js 20+** installed.

1. **Clone the repository**
   ```bash
   git clone https://github.com/bch15/ExcaliVault.git
   cd ExcaliVault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```
   *This will create a `dist` folder containing the production-ready extension.*

4. **Load into Browser**

   ### 🟢 Chrome / Edge / Brave / Vivaldi (Chromium)
   1. Go to `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
   2. Enable **Developer Mode** (toggle in top right).
   3. Click **Load unpacked**.
   4. Select the `dist` folder from the project directory.

   ### 🔴 Opera / Opera GX
   1. Go to `opera://extensions`.
   2. Enable **Developer Mode**.
   3. Click **Load unpacked** and select the `dist` folder.

   ### 🦊 Firefox
   1. Go to `about:debugging#/runtime/this-firefox`.
   2. Click **Load Temporary Add-on...**.
   3. Select the `manifest.json` file inside the `dist` folder.

   ### 🧭 Safari (macOS)
   *Note: Safari requires converting the extension using Xcode.*
   1. Run: `xcrun safari-web-extension-converter dist`
   2. Open the generated Xcode project and run it.

---

## 🚀 Usage

Once installed, simply visit [excalidraw.com](https://excalidraw.com). You will see the **ExcaliVault** toolbar at the top-left of the screen.

- **💾 Save**: Manually save your current drawing to the library and download a backup.
- **📂 Load**: Import an existing `.excalidraw` file from your computer.
- **📚 Library**: Open the side drawer to view and manage your saved projects.
- **✨ New**: Clear the canvas and start a new drawing.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/bch15/ExcaliVault/issues).

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Developed by [Behzad Chaharbaghi](https://github.com/bch15)*
