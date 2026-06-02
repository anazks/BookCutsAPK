# Maestro E2E Testing Guide (Windows + WSL2 Setup)

This guide walks you through setting up and running **Maestro UI tests** inside your **WSL2 (Windows Subsystem for Linux)** environment and connecting it to your Android Emulator running on Windows.

---

## 1. Prerequisites
1. **WSL2** installed and configured on Windows.
2. **Android Studio** & an **Android Emulator** running on your Windows host.
3. **Android SDK Platform Tools** installed on both Windows and WSL2 (make sure ADB versions match).

---

## 2. Step-by-Step Setup

### Step A: Install Maestro inside WSL2
Open your WSL2 terminal (Ubuntu/Debian) and run the following command:
```bash
curl -FsSL https://get.maestro.mobile.dev | bash
```
Once installed, restart your WSL2 shell or reload your profile:
```bash
source ~/.bashrc
```

Verify that Maestro is installed:
```bash
maestro --version
```

---

### Step B: Connect WSL2 ADB to your Windows Host (Emulator or Physical Device)
Whether you are using an Android Emulator or a physical Android device connected via USB, WSL2 needs to communicate with the Windows ADB host.

#### If using a Physical Android Device:
1. **Enable Developer Options**: Go to *Settings -> About Phone* on your Android device and tap **Build Number** 7 times.
2. **Enable USB Debugging**: Go to *Settings -> System -> Developer Options* and turn on **USB Debugging**.
3. **Connect to PC**: Connect your phone to your Windows PC via USB cable. If prompted on the phone, select "Allow USB debugging".

#### Connection Configuration:
1. **Locate your ADB executable on Windows** (typically `C:\Users\<YourUsername>\AppData\Local\Android\Sdk\platform-tools\adb.exe` or `C:\platform-tools\adb.exe`).
2. **Kill any running ADB servers on both host and WSL2**:
   - In Command Prompt (Windows): `adb kill-server`
   - In WSL2: `adb kill-server`
3. **Start the Windows ADB server binding to all network interfaces**:
   Open Windows PowerShell / CMD as Administrator and run:
   ```cmd
   adb -a nodaemon server start
   ```
4. **Connect WSL2 to the Windows ADB server**:
   In your WSL2 terminal, add the following environment variable to route ADB commands to Windows:
   ```bash
   export ADB_SERVER_SOCKET=tcp:$(ip route | grep default | awk '{print $3}'):5037
   ```
   *Tip: Add this line to your WSL `~/.bashrc` so you don't have to run it every time.*

5. **Verify the connection in WSL2**:
   Run the following inside WSL2:
   ```bash
   adb devices
   ```
   You should see your physical phone listed under `List of devices attached` (e.g. `aa12bb34 device` or `emulator-5554 device`).

---

### Step C: Build the App (Development or Release Build)
Maestro needs to run against a compiled APK/APP containing the package identifier `com.anazk.bookmycuts`.

- **Development Build (Expo Dev Client)**:
  Run the build command on Windows:
  ```bash
  npm run android
  ```
- **Release APK**:
  If you build a local release APK, install it on the emulator:
  ```bash
  adb install <path-to-your-release-apk>.apk
  ```

---

## 3. Running E2E Tests
From the root of your `BookCutsAPK` directory in WSL2:

### Run All Flows in Sequence
```bash
npm run test:e2e
# or
maestro test .maestro/
```

### Run Individual Flows
- **Onboarding and Language selection**:
  ```bash
  npm run maestro:onboarding
  ```
- **Client Login flow**:
  ```bash
  npm run maestro:login:user
  ```
- **Salon Owner Login flow**:
  ```bash
  npm run maestro:login:shop
  ```
- **Browse & Book Barber Appointment flow**:
  ```bash
  npm run maestro:booking
  ```

---

## 4. Troubleshooting & Tips

### ADB Version Mismatch
If WSL2 complains about `adb server version (41) doesn't match this client (40)`, you must ensure that both Windows and WSL2 are using the exact same version of the ADB client.
1. Check WSL2 adb version: `adb version`
2. Check Windows adb version: `adb.exe version`
3. Download the matching version or copy the `adb` binary from your Windows platform-tools directory directly into WSL2:
   ```bash
   sudo cp /mnt/c/Users/<YourUsername>/AppData/Local/Android/Sdk/platform-tools/adb /usr/bin/adb
   ```

### Emulator Not Found
Make sure the emulator is active and visible on Windows. Run `adb devices` in Command Prompt on Windows to check. If it is visible on Windows but not WSL2, verify that your Windows Firewall allows port `5037` traffic or check that you ran `adb -a nodaemon server start` on Windows.
