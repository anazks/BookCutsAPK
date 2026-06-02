# BookMyCuts Frontend Manual Test Cases

This document provides a comprehensive suite of manual test cases designed for verifying the **BookMyCuts** mobile application (built with React Native & Expo). 

---

## 📋 Table of Contents
1. [Overview & Test Environment Setup](#overview--test-environment-setup)
2. [Module 1: Onboarding & Role Selection (TC-ONB)](#module-1-onboarding--role-selection-tc-onb)
3. [Module 2: User & Shop Owner Authentication (TC-AUTH)](#module-2-user--shop-owner-authentication-tc-auth)
4. [Module 3: Client Discovery, Search & Explore (TC-DISC)](#module-3-client-discovery-search--explore-tc-disc)
5. [Module 4: Booking Flow (TC-BOOK)](#module-4-booking-flow-tc-book)
6. [Module 5: Payment & Checkout Integration (TC-PAY)](#module-5-payment--checkout-integration-tc-pay)
7. [Module 6: Shop Owner - Profile & Shop Configuration (TC-SHOP)](#module-6-shop-owner---profile--shop-configuration-tc-shop)
8. [Module 7: Loyalty, Rewards & Miscellaneous (TC-MISC)](#module-7-loyalty-rewards--miscellaneous-tc-misc)
9. [Module 8: Edge Cases & UX Robustness (TC-EDGE)](#module-8-edge-cases--ux-robustness-tc-edge)
10. [Test Execution Summary Template](#test-execution-summary-template)

---

## 🛠️ Overview & Test Environment Setup

### Supported Devices & Platforms
* **Android**: OS 9.0 (Pie) and above. Recommended testing on both physical devices and emulators.
* **iOS**: iOS 15.0 and above. Recommended testing on simulators and physical iPhones.
* **Network Speeds**: 4G, 5G, Wi-Fi, and Simulated Low Connection (3G/2G) or Offline mode.

### Pre-requisites for Testing
1. **Development Server**: The Expo development server must be running (`npm run start` or `npm run android`).
2. **Backend API**: The backend server (configured in `.env`) must be reachable.
3. **Database State**: Access to a test database where slots, test users, and test salons can be added or reset.
4. **Test Payment Instruments**: Razorpay Sandbox/Test API keys configured, using standard UPI / Card test credentials.

---

## 🚀 Module 1: Onboarding & Role Selection (TC-ONB)

This module validates the user's first-time experience, language preferences, and routing based on role selection (User vs. Shop Owner).

| Test ID | Test Scenario | Pre-requisites | Action Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ONB-01** | First Launch & Welcome Screen | Fresh installation (or clear app cache/state) | 1. Launch the BookMyCuts app.<br>2. Verify if the Welcome screen is displayed with "Get Started" button. | The Welcome screen loads successfully with premium typography and logo.<br>"Get Started" button is clickable. | Critical |
| **TC-ONB-02** | Language Selection Flow | Clicked "Get Started" | 1. On the language screen, click "English" (or another language).<br>2. Verify the "Continue" button becomes active.<br>3. Click "Continue". | Language selection is registered.<br>User is advanced to the Role Selection screen. | High |
| **TC-ONB-03** | Role Choice - Register as User | Clicked "Continue" from Language Screen | 1. Tap the card option "No, Register as User".<br>2. Click the "Continue" button. | User is routed to the **Client Login/Register** landing screen ("Ready for a fresh look?"). | Critical |
| **TC-ONB-04** | Role Choice - Register Shop | Clicked "Continue" from Language Screen | 1. Tap the card option "Yes, Register Shop".<br>2. Click the "Continue" button. | User is routed to the **Shop Owner Signup** screen ("Create Your Shop"). | Critical |
| **TC-ONB-05** | Role Selection Back Navigation | On Role Selection screen | 1. Click the physical back button (Android) or top-left back arrow.<br>2. Change language on Language screen.<br>3. Advance back to Role Selection. | Back button correctly routes user back to Language selection screen.<br>Changing the language changes the text translations on the Role selection screen. | Medium |

---

## 🔑 Module 2: User & Shop Owner Authentication (TC-AUTH)

Covers Login, Signup, OTP authentication, Forgot Password, and validation rules for both User and Shop Owner types.

| Test ID | Test Scenario | Pre-requisites | Action Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Client Registration | TC-ONB-03 completed | 1. Click "Register" / "Sign Up".<br>2. Fill in Full Name, Email, Phone Number, Password.<br>3. Tap "Sign Up". | Registration success message is shown.<br>Reroutes user to Login or OTP Verification. | Critical |
| **TC-AUTH-02** | Form Field Validation - Client Register | On Client Register Screen | 1. Enter invalid email (e.g. `user@com`).<br>2. Enter short password (< 6 chars).<br>3. Attempt to submit. | Form displays explicit validation errors under the respective inputs.<br>Submit button does not hit the backend. | High |
| **TC-AUTH-03** | Client Email/Password Login | On Client Login Screen | 1. Enter valid email: `user@example.com`.<br>2. Enter password: `password123`.<br>3. Tap "Sign In". | User is logged in successfully and redirected to the Home Tab with the banner "style match ✂️". | Critical |
| **TC-AUTH-04** | Client Login OTP | On Login screen, option "Login via OTP" selected | 1. Enter valid 10-digit mobile number.<br>2. Click "Send OTP".<br>3. Enter OTP code received (or test code).<br>4. Click "Verify". | OTP is sent and Verification screen shows up.<br>Valid OTP redirects to Home Tab.<br>Invalid OTP shows an inline error. | High |
| **TC-AUTH-05** | Password Visibility Toggle | On Login/Register screens | 1. Type password in Password field.<br>2. Tap the Eye icon on the right side of the field.<br>3. Tap the Eye icon again. | First tap reveals the password characters in plain text.<br>Second tap masks the password back to dots. | Low |
| **TC-AUTH-06** | Shop Owner Login | TC-ONB-04 completed (Navigate to Login via link) | 1. Enter valid shop owner email `shopowner@example.com`.<br>2. Enter `password123`.<br>3. Click "Sign In". | Logs in successfully and redirects to Shop Owner Dashboard with banner "Welcome back, [Name]". | Critical |

---

## 🔍 Module 3: Client Discovery, Search & Explore (TC-DISC)

Validates how clients search, view, and interact with the list of salons and shop feeds.

| Test ID | Test Scenario | Pre-requisites | Action Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-DISC-01** | Home Feed Salon List Loading | Logged in as Client | 1. Load the Home Screen.<br>2. Verify that local salons are loaded with details (name, rating, distance, price). | Salons cards load with high-quality images, tags, ratings, and distances.<br>No skeleton loader freeze. | High |
| **TC-DISC-02** | Search Salons & Filtering | On Explore / Book tab | 1. Tap on Search bar.<br>2. Type a specific salon name (e.g., "Classic Cuts").<br>3. Filter by distance or rating. | Results update dynamically (or on hitting enter).<br>Only matching salons are shown. | High |
| **TC-DISC-03** | Salon Profile Details (Feed) | On Home/Explore | 1. Click on a Salon Card.<br>2. Verify view of salon page: services list, shop photos, working hours, and reviews. | Redirects to `BarberShopFeed.tsx`. Shows accurate data, list of services, prices, and a visible "Book Now" CTA. | Critical |

---

## 📅 Module 4: Booking Flow (TC-BOOK)

Validates the multi-step booking process from service selection to checkout preparation.

| Test ID | Test Scenario | Pre-requisites | Action Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BOOK-01** | Step 1: Service Selection | On Salon Profile page | 1. Select one or more services (e.g. "Haircut", "Beard Trim").<br>2. Verify the booking cart / total price updates.<br>3. Tap "Next". | Cart counts items correctly and sums prices.<br>"Next" button becomes active and navigates to Select Date screen. | Critical |
| **TC-BOOK-02** | Step 2: Date Selection Picker | Step 1 completed | 1. Tap "Tap to select date".<br>2. Pick a future date (e.g., current day + 1).<br>3. Tap "Next". | Picker operates smoothly. Past dates are greyed out / unselectable.<br>Selecting a valid date updates the field and enables "Next". | Critical |
| **TC-BOOK-03** | Step 3: Barber & Time Slot Selection | Step 2 completed | 1. Choose "Any Barber" or select a specific barber from the list.<br>2. Choose an available time slot (e.g., "10:00 AM").<br>3. Tap "Next". | Selected slot highlights. Already booked slots are disabled/unselectable.<br>Navigates to Booking Summary screen. | Critical |
| **TC-BOOK-04** | Step 4: Summary & Confirm | Step 3 completed | 1. Review Summary details: services, date, time, barber, total cost.<br>2. Tap "Book Appointment". | Displays "Almost done!" and booking details correctly.<br>Tap triggers Confirmation modal showing slot hold timer if applicable. | Critical |
| **TC-BOOK-05** | Step 5: Modal to Payment Redirect | On Booking Summary confirmation modal | 1. Verify "Appointment Details" text.<br>2. Click "Continue".<br>3. Tap "Continue to Payment". | Triggers checkout flow and redirects to Payment screen/Checkout page. | Critical |

---

## 💳 Module 5: Payment & Checkout Integration (TC-PAY)

Validates Razorpay payment integration, checkout summaries, success triggers, and failure handlers.

| Test ID | Test Scenario | Pre-requisites | Action Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PAY-01** | Payment Page Layout & Total | Redirected from Booking flow | 1. On `Payment.tsx` screen, verify the booking amount matches the selected service amount.<br>2. Verify "Pay Now" CTA is present. | Amount matches summary. Razorpay SDK loads when "Pay Now" is clicked. | High |
| **TC-PAY-02** | Successful Razorpay Payment | Razorpay gateway modal is active | 1. Select "Card" / "UPI" in Test Mode.<br>2. Input test credentials.<br>3. Complete payment successfully. | Razorpay modal closes.<br>User is routed to Payment Success screen with a booking confirmation ID.<br>Confetti cannon animation triggers. | Critical |
| **TC-PAY-03** | Failed Razorpay Payment | Razorpay gateway modal is active | 1. Click "Cancel Payment" or trigger a payment failure (e.g., insufficient funds). | User is redirected to `PyementFail.tsx` screen.<br>Appropriate failure message and a "Retry Payment" option are displayed. | Critical |
| **TC-PAY-04** | Booking Status Reflection | Payment success | 1. Go to "Bookings" tab (`Bookings.tsx`). | The new booking appears under the "Upcoming" section with status "Confirmed". | High |

---

## 💈 Module 6: Shop Owner - Profile & Shop Configuration (TC-SHOP)

Validates features available for the Salon/Shop Owners to set up and manage their businesses.

| Test ID | Test Scenario | Pre-requisites | Action Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SHOP-01** | Shop Onboarding (First login) | Logged in as Shop Owner, no shop created yet | 1. Redirected to `DoYouHaveShopScreen.tsx`.<br>2. Answer yes/no and complete the form in `CreateShopScreen.tsx`. | Details like Shop Name, Address, Category are successfully saved.<br>Navigates to Dashboard. | Critical |
| **TC-SHOP-02** | Working Hours Configuration | Logged in as Shop Owner | 1. Navigate to "Working Hours".<br>2. Set start/end times and check toggles for active days.<br>3. Click "Save". | Settings are updated on the backend.<br>Client booking calendar is immediately updated to reflect these hours. | High |
| **TC-SHOP-03** | Bank Details Setup | Logged in as Shop Owner | 1. Go to "Bank Details".<br>2. Enter Account Holder, Account Number, IFSC code.<br>3. Save details. | Form performs check on account number match and IFSC format (11 chars).<br>Success banner shown. | High |
| **TC-SHOP-04** | Service & Slot Management | Logged in as Shop Owner | 1. Add a new service (e.g., "Hair coloring", price, duration 45 mins).<br>2. Delete or edit an existing service. | New service immediately becomes available on the Shop's client-facing profile. | High |
| **TC-SHOP-05** | Image/Media Uploads | Logged in as Shop Owner | 1. Go to "Upload Media".<br>2. Trigger Image Picker and select a photo from gallery/camera.<br>3. Upload. | Image is uploaded (via Cloudinary integration) and displayed in the gallery preview card. | Medium |

---

## 🎁 Module 7: Loyalty, Rewards & Miscellaneous (TC-MISC)

Validates auxiliary features like rewards, referrals, support, and push notifications.

| Test ID | Test Scenario | Pre-requisites | Action Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MISC-01** | Refer & Earn / Referral Code | On ReferralDetails screen | 1. Navigate to Referral details.<br>2. Click "Copy Code" or "Share". | Referral code is copied to clipboard.<br>Native sharing sheet opens. | Medium |
| **TC-MISC-02** | Rewards Scratch Card / Points | On Rewards screen | 1. Check current point balance.<br>2. Tap to unlock a reward card. | Points update correctly.<br>Confetti triggers on milestone unlock. | Low |
| **TC-MISC-03** | Support Form Submission | On Support page | 1. Fill out issue description and contact details.<br>2. Click "Submit". | Validation checks that input is not empty.<br>Success toast is displayed: "Ticket Created". | Medium |
| **TC-MISC-04** | Notifications Screen | Multiple booking updates | 1. Go to `Notifications.tsx`. | A chronological list of notifications (booking confirmations, reminders) is rendered. | Medium |

---

## ⚡ Module 8: Edge Cases & UX Robustness (TC-EDGE)

Validates app performance, state retention, and user experience under unexpected conditions.

| Test ID | Test Scenario | Pre-requisites | Action Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-EDGE-01** | Network Disconnection (Offline Mode) | App is running | 1. Turn off Wi-Fi and mobile data.<br>2. Attempt to navigate or load list. | App displays a friendly "No Internet Connection" banner or offline fallback illustration.<br>No crash or blank screen. | High |
| **TC-EDGE-02** | Network Reconnection (Re-sync) | Offline mode active | 1. Turn on Wi-Fi/data while on a screen with stale data.<br>2. Try performing an action (e.g. Booking). | App automatically retries or prompts to reload data.<br>Data successfully updates without restarting the app. | High |
| **TC-EDGE-03** | App Backgrounding & State Retention | Middle of booking flow | 1. Navigate to step 3 (Barber selection).<br>2. Send app to background for 30s.<br>3. Bring app to foreground. | App retains the selected state (service, date, barber) and does not force-restart to onboarding. | Medium |
| **TC-EDGE-04** | Fast Double-Taps on Book / Pay | Middle of checkout | 1. On payment confirm, double-tap the "Pay" button quickly. | API call throttled / button disabled after first click.<br>No double bookings or duplicate charges are made. | High |
| **TC-EDGE-05** | Validation: Past Dates & Times | Selecting time | 1. Try to book a slot that has already passed in the current day (e.g., current time is 2:00 PM, try to click 11:00 AM slot). | Past slots on the current day must be disabled/greyed out. | High |

---

## 📝 Test Execution Summary Template

Use this template to log manual test runs.

```markdown
### 🗓️ Test Run Details
* **Tester Name**: _______________________
* **Execution Date**: ____________________
* **App Version / Build**: _______________
* **Test Environment**: [ ] Dev  [ ] Staging  [ ] Production
* **Devices Tested**: ____________________ (e.g. iPhone 14 Pro, Samsung Galaxy S23)

### 📊 Summary Metrics
* **Total Cases Executed**: ______
* **Pass Count**: ______
* **Fail Count**: ______
* **Blocked Count**: ______

### 🚨 Failed Test Cases Log
| Case ID | Feature | Issue Description | Severity | Steps to Reproduce |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
| | | | | |

### 💬 Remarks & Recommendations
_________________________________________________________________________________________
_________________________________________________________________________________________
```
