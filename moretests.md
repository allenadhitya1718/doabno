# DOABNO: more tests, done the way a real person tests

Written 2026-10-16. This is the **second half** of `TESTING-MANUAL.md`. The manual checks features one by one. This file checks what happens when a *person* uses the site: someone in a hurry, someone confused, someone careless, someone on a bad phone. Nothing here is a formal script you can pass by following steps exactly. You are meant to **poke at it, get it wrong on purpose, and notice what feels off**.

Use both files together. Every row here has a Pass/Fail box so it can be ticked and printed.

---

## 0. Read this first

### 0.1 Safety rules (the site talks to the real database)
- The live project holds real accounts once launch starts. Anything you sign up, save, favorite, alert, request, suspend, export or delete is **real**.
- Use only addresses like `yourname+test1@gmail.com` and put **TEST** in names you type. Never use a real shopper's account to test.
- Never run `reset-dev.sql`, restore tests, bulk deletes or "delete user" on a real person. Do those on a **throwaway Supabase project**.
- Never use the **secret** (`service_role`) key anywhere while testing, and never paste any key, password or token into a bug report or a chat.
- In the admin, only edit products, stores and coupons you can undo, and note the old value first. Do not pause a real store or hide a real product on a live site without telling the team.
- Do not trigger real emails to people outside the team. Send alert emails only to your own test inboxes.
- Never turn on or test anything involving payment, a real affiliate network login, or a client's bank details.

### 0.2 What you need
- Two browsers (or one normal and one private window), logged in as **different users** (one shopper, one admin) for the "two people at once" checks.
- A real **Android phone** and a real **iPhone** (borrow one). Desktop emulation is not enough for section 4.
- Three test inboxes (plus-addresses on one mailbox are fine).
- A note-taking habit: write what you **felt** ("this was confusing"), not only pass or fail. Those notes are the point of this file.
- Dev tools open on the Console and Network tabs on at least one run.

### 0.3 Suggested order and time
| Part | What | About |
|---|---|---|
| 1 | Cold-eyes first impression (5 people-style tours) | 45 min |
| 2 | Normal shoppers, the "day in the life" journeys | 1 h 30 min |
| 3 | Careless and impatient behaviour | 1 h |
| 4 | Real phones and bad conditions | 1 h 30 min |
| 5 | Two people at once | 45 min |
| 6 | Reading and wording | 45 min |
| 7 | Admin as a real staff member | 1 h 15 min |
| 8 | Messing with the system on purpose | 1 h |
| 9 | Closing questions and sign-off | 15 min |
| | **Total** | **about 9 hours** (split over two days) |

### 0.4 How to mark rows
Tick **Pass** if it felt right. Tick **Fail** if it broke, **or if a normal person would be confused or annoyed**, even if it is technically working. Write a note in the last column. Use the bug template in `TESTING-MANUAL.md` section 17.

---

## 1. Cold-eyes first impression

Do this **before** you read any other test, ideally with someone who has never seen the site. Give them the address and one sentence: *"This compares prices for the same product in different stores."* Then say nothing and watch (or do it yourself and note what you wonder about).

| ID | What to do | Look for | Pass | Fail | Notes |
|---|---|---|:-:|:-:|---|
| H1-1 | Open the home page and count to 5 without scrolling | Can you say, in one sentence, what this site does? Is the search box the first thing you look at? | ☐ | ☐ | |
| H1-2 | Ask: "where would you click first?" | Was it the search box or a category, not something decorative? | ☐ | ☐ | |
| H1-3 | Ask: "do you trust this?" | Anything that looks fake, broken, unfinished, or like a demo (lorem ipsum, "placeholder", test names, stock photos that don't match)? | ☐ | ☐ | |
| H1-4 | Look at a product price | Is it clear which price is **the best** and what is included (delivery)? Can you tell where the "Visit store" button leads? | ☐ | ☐ | |
| H1-5 | Ask: "how does this site make money?" | Is the affiliate disclosure easy to find without hunting? | ☐ | ☐ | |
| H1-6 | Switch to Arabic without being told where | Did you find the language button within 10 seconds? | ☐ | ☐ | |
| H1-7 | Try the site in a language you do not read, if you can | Do icons and layout still make the flow clear? | ☐ | ☐ | |
| H1-8 | Leave the page and come back in 10 minutes | Does it still make sense, or did it reset in a surprising way? | ☐ | ☐ | |

---

## 2. Day-in-the-life journeys (normal people)

Play each person as realistically as you can. Do not follow the "expected" path unless it is the natural one.

### 2.1 Sara, 28, Riyadh: wants cheap headphones before Friday
1. Opens the site on her phone, in Arabic, Saudi market.
2. Types "headphones" (in Arabic first, then English). Sorts by lowest price.
3. Opens the top result, looks at the offers, checks free delivery and delivery days.
4. Taps "Visit store" on the cheapest, then comes back with the back button.
5. Decides to wait for a lower price: sets an alert, ticks email consent.
6. Signs up (she is not signed in), confirms by email on **her phone's mail app**, and gets back to the site.
7. Closes the tab, opens the site again the next day.

| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H2-1 | The Arabic search finds the same things as English | ☐ | ☐ | |
| H2-2 | After "Visit store" and back, she is exactly where she left (same page, same scroll, same filters) | ☐ | ☐ | |
| H2-3 | When she signs up in the middle of setting an alert, the alert is **not lost**; she lands back on the product, signed in | ☐ | ☐ | |
| H2-4 | The confirmation email opens in the mail app's in-app browser, and the site still signs her in (or clearly tells her to open it in her normal browser) | ☐ | ☐ | |
| H2-5 | Next day: she is still signed in and the alert is still there | ☐ | ☐ | |
| H2-6 | The email subject and text are Arabic, right-to-left, readable on her phone | ☐ | ☐ | |

### 2.2 Tom, 41, London: compares two laptops and a coupon
1. UK market, English, currency in GBP. Browses Electronics, then Laptops.
2. Opens two products in two tabs and compares them.
3. Looks for a coupon on the store's offer, copies the code.
4. Favorites both, then removes one.
5. Switches the currency to USD to show a friend, then back.

| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H2-7 | Two tabs of two products do not confuse each other | ☐ | ☐ | |
| H2-8 | The coupon code copies and **works on the store** (try it for real once, on a cheap item you do not buy) | ☐ | ☐ | |
| H2-9 | Changing currency in one tab changes it in the other tab after a refresh, with no wrong prices in between | ☐ | ☐ | |
| H2-10 | Switching the currency and back gives exactly the original prices (no 0.01 drift) | ☐ | ☐ | |

### 2.3 Omar, 55, Dubai: not good with phones
1. Uses the site at 200% text size.
2. Taps small things with a thumb and misses.
3. Does not know what a "filter" is.

| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H2-11 | Buttons are big enough to tap without hitting the neighbour | ☐ | ☐ | |
| H2-12 | Nothing important is hidden behind a tiny icon with no words | ☐ | ☐ | |
| H2-13 | If he taps the wrong thing, there is always an obvious way back | ☐ | ☐ | |
| H2-14 | At 200% text the page still works without sideways scrolling | ☐ | ☐ | |

### 2.4 Lina, 19, student: shops on a slow bus connection
| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H2-15 | On Slow 3G, something useful shows within a few seconds (not a white page) | ☐ | ☐ | |
| H2-16 | Pictures that load late do not push text around while she is reading (no jumping) | ☐ | ☐ | |
| H2-17 | Losing signal while searching shows a calm message, not a stack of errors | ☐ | ☐ | |

### 2.5 Mike, 33, New York: cares about privacy
1. Reads the privacy policy, finds "do not sell or share" (CCPA), turns it on.
2. Downloads his data, then deletes his account.
3. Files a privacy request for something else.

| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H2-18 | He finds the privacy and CCPA links from any page in two clicks | ☐ | ☐ | |
| H2-19 | The data download contains only **his** data and is readable (not a wall of ids) | ☐ | ☐ | |
| H2-20 | After deletion he is told clearly what was removed and what happens next; he cannot sign back in | ☐ | ☐ | |
| H2-21 | His privacy request shows a reference number he can quote | ☐ | ☐ | |

---

## 3. Careless and impatient behaviour

People do not wait, read, or follow order. Do all of these to a **fresh** browser.

| ID | What to do | Expected | Pass | Fail | Notes |
|---|---|---|:-:|:-:|---|
| H3-1 | Click a button, then click it again 5 times fast | One action, not five (no five accounts, five alerts, five emails) | ☐ | ☐ | |
| H3-2 | Fill the sign-up form, press **back** halfway | You do not lose the page; no half-created account | ☐ | ☐ | |
| H3-3 | Submit sign-up, then immediately **refresh** | No second account; no error screen | ☐ | ☐ | |
| H3-4 | Open the confirmation link, then **press back** | You do not end up on a broken page or a signed-out loop | ☐ | ☐ | |
| H3-5 | Close the tab in the middle of saving an alert | After reopening, the alert is either saved or clearly not saved | ☐ | ☐ | |
| H3-6 | Press the browser **forward** button after sign-out | Never shows the signed-in account's data | ☐ | ☐ | |
| H3-7 | Type the address by hand: no `https`, upper-case, a typo (`/prodcuts`) | Lands on the site or a friendly "not found", not an ugly browser error | ☐ | ☐ | |
| H3-8 | Paste a long product address from a friend | Opens the right product | ☐ | ☐ | |
| H3-9 | Type a price with a comma (`1,299`), with Arabic digits (`١٢٩٩`), with a currency sign (`SAR 50`) | Understood or politely refused, never `NaN` | ☐ | ☐ | |
| H3-10 | Type your email with a capital letter and a trailing space | Works as the same email | ☐ | ☐ | |
| H3-11 | Paste a password from a password manager (with a trailing space) | Works, or the form says the space is a problem | ☐ | ☐ | |
| H3-12 | Let autofill fill the sign-up form | Fields are recognised (email, new-password); the browser offers to save | ☐ | ☐ | |
| H3-13 | Put the phone in the pocket mid-load (screen off) and return | The page recovers | ☐ | ☐ | |
| H3-14 | Open 15 tabs of the site and use three of them | Nothing breaks; no rate limit surprise | ☐ | ☐ | |
| H3-15 | Hit Enter in the search box with nothing in it, three times | No error, no loop | ☐ | ☐ | |
| H3-16 | Tap a product, tap back, tap another, tap back, 20 times | The page stays quick; no memory leak feel | ☐ | ☐ | |
| H3-17 | Right-click, open in a new tab, middle-click, copy link address on product cards and buttons | Normal links behave like links | ☐ | ☐ | |
| H3-18 | Select all text and drag it onto the search box | Does not break the page | ☐ | ☐ | |
| H3-19 | Press **Escape** in each dialog, click outside, press the browser back | Each closes the dialog without losing the page | ☐ | ☐ | |
| H3-20 | Click the logo from deep inside the site | Always goes home | ☐ | ☐ | |

---

## 4. Real phones and bad conditions

Desktop emulation misses real problems. Use real devices.

### 4.1 Real-device settings to note before you start
- Phone model, OS version, browser (Chrome, Samsung Internet, Safari), battery level, data or Wi-Fi.
- Turn **animations on** (Android developer options at 1x) so you see them as designed; also test with **reduce motion on**.
- Keep the screen on and the timeout long. Note the **time of day** (some images load slower).

### 4.2 The tests
| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H4-1 | Home loads on mobile data (not Wi-Fi), first visit | ☐ | ☐ | |
| H4-2 | Tapping the search box opens the keyboard **without** zooming or hiding the box (iPhone Safari zooms into inputs smaller than 16px) | ☐ | ☐ | |
| H4-3 | The keyboard does not cover the field you are typing in (sign-up, alert target) | ☐ | ☐ | |
| H4-4 | Rotate to landscape and back during a form | No data lost; layout adjusts | ☐ | ☐ | |
| H4-5 | The notch and the bottom bar of the phone do not cover tabs or buttons | ☐ | ☐ | |
| H4-6 | iPhone Safari: add to home screen and open it | Icon and name are right; page works (note that it is not an installable app yet) | ☐ | ☐ | |
| H4-7 | Open a confirmation email link from Gmail, Outlook and Apple Mail | Signs in or clearly explains; never blank | ☐ | ☐ | |
| H4-8 | Open the site from a link inside WhatsApp, Instagram or Facebook's in-app browser | Loads; sign-up works or explains | ☐ | ☐ | |
| H4-9 | Copy a coupon code with a long press and paste it into the store's app | Works | ☐ | ☐ | |
| H4-10 | Tap "Visit store" when the store has an app installed | Opens in the browser or the app, but never a dead end | ☐ | ☐ | |
| H4-11 | Switch to airplane mode while browsing, then back | Calm message, and the page recovers by itself | ☐ | ☐ | |
| H4-12 | Open the site with data saver on | Still works | ☐ | ☐ | |
| H4-13 | Dark mode on the phone | Text readable everywhere; no white box with white text | ☐ | ☐ | |
| H4-14 | System font set to **Large** | No cut-off text | ☐ | ☐ | |
| H4-15 | Scroll a long list quickly with a flick | Smooth; no stutter or blank patches | ☐ | ☐ | |
| H4-16 | Battery saver on | Still usable | ☐ | ☐ | |
| H4-17 | An old phone (3 or more years old, low RAM) | Still usable, even if slower | ☐ | ☐ | |
| H4-18 | 20 minutes of normal use | The phone does not get hot; the browser does not crash | ☐ | ☐ | |
| H4-19 | Call or message interrupts you mid-signup | You return and nothing is lost | ☐ | ☐ | |
| H4-20 | Change the phone region or language to Arabic and reload | The site follows your choice, not a wrong guess | ☐ | ☐ | |
| H4-21 | Android Chrome: check the console over USB (`chrome://inspect`) | No red errors in normal use | ☐ | ☐ | |
| H4-22 | Slow network: set the phone to 2G or use Slow 3G | Search works; images may be late but nothing breaks | ☐ | ☐ | |

---

## 5. Two people at once

Use two browsers, **two different accounts**, side by side.

| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H5-1 | User A favorites a product; user B (different account) does not see it | ☐ | ☐ | |
| H5-2 | Same account, two devices: favorite on the phone; refresh the laptop | Shows the same list | ☐ | |
| H5-3 | Same account, two devices: delete an alert on one, set a different one on the other at the same time | Both changes survive, no ghost alert | ☐ | |
| H5-4 | Sign out on the phone while the laptop is open; then use the laptop | The laptop either continues (separate session) or asks to sign in, never half-works | ☐ | |
| H5-5 | Change your password on one device | The other device is asked to sign in again within a reasonable time | ☐ | |
| H5-6 | Admin hides a product while a shopper is looking at it | The shopper sees "not available" on the next action, not a crash | ☐ | |
| H5-7 | Admin changes an exchange rate while a shopper browses | The shopper sees new prices on refresh; nothing mixes old and new on one page | ☐ | |
| H5-8 | Admin pauses a store while a shopper is on one of its offers | The offer disappears on refresh; "Visit store" still works or is refused politely | ☐ | |
| H5-9 | Admin suspends the shopper while the shopper is signed in | The shopper's next action is refused politely | ☐ | |
| H5-10 | Admin deletes the shopper while the shopper is signed in | The shopper is signed out with no error loop | ☐ | |
| H5-11 | Two admins edit the same product name at the same moment | The last save wins; **both** show in the audit log; nobody sees a crash | ☐ | |
| H5-12 | Two admins add a team member with the same email | One succeeds; the other gets a clear message | ☐ | |
| H5-13 | The admin removes your role while you are on a screen | Your next save is refused with a toast, and the screen reloads | ☐ | |

---

## 6. Reading and wording (a proofreader's pass)

Read every screen out loud. Wording problems erode trust faster than bugs.

| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H6-1 | Every error message says **what happened and what to do** ("Check your email and try again"), not "Error 400" | ☐ | ☐ | |
| H6-2 | No technical words reach the user: `null`, `undefined`, `NaN`, `JWT`, `RLS`, `PostgREST`, stack traces, raw JSON | ☐ | ☐ | |
| H6-3 | Spelling and grammar in English, on every page | ☐ | ☐ | |
| H6-4 | Arabic read by a **native speaker**: natural, not machine-sounding; same meaning as the English | ☐ | ☐ | |
| H6-5 | Same thing, same word everywhere ("alert" vs "notification", "saved" vs "favorites") | ☐ | ☐ | |
| H6-6 | Dates and times in the person's format; "verified 3 min ago" in Arabic reads right | ☐ | ☐ | |
| H6-7 | Buttons say what they do ("Visit store", not "Go"); destructive ones say so ("Delete my account") | ☐ | ☐ | |
| H6-8 | Confirmation texts for delete / suspend say what will happen and that it cannot be undone | ☐ | ☐ | |
| H6-9 | Emails: subject, greeting, and signature are consistent and branded as DOABNO | ☐ | ☐ | |
| H6-10 | Legal pages say "placeholder" nowhere; the contact address and company name are real | ☐ | ☐ | |
| H6-11 | Prices always show the currency; shipping is labelled; "free" is spelled the same everywhere | ☐ | ☐ | |
| H6-12 | Empty states (no results, no favorites, no coupons) give a friendly next step | ☐ | ☐ | |

---

## 7. Admin as a real staff member

Be a person on their first day, with an hour to do real jobs. **Use a throwaway or staging project when a step edits data.**

### 7.1 Job list for a new catalog editor (role: catalog)
1. Sign in, find a product by searching its brand.
2. Fix a typo in the product name, in English and in Arabic.
3. Hide a product, then check the public site, then show it again.
4. Change an exchange rate by a small amount and check a price on the site.
5. Add a popular search and see it in the site's suggestions.
6. Notice that you **cannot** touch coupons or users.

| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H7-1 | Everything you need for these jobs is findable without being told where | ☐ | ☐ | |
| H7-2 | Saving gives a clear "saved" sign; failing gives a clear "not saved" sign | ☐ | ☐ | |
| H7-3 | Things you are not allowed to do are **hidden or greyed**, not shown and then refused | ☐ | ☐ | |
| H7-4 | Typos and mistakes can be undone easily (and you can see the old value) | ☐ | ☐ | |
| H7-5 | The audit log shows each of your changes in plain words | ☐ | ☐ | |

### 7.2 Job list for the owner
1. Add a new team member (analyst), have them sign up first, give the role, check they see only what an analyst sees.
2. Look up a shopper, open their drawer, read the details, export their data, close it.
3. Answer a privacy request: open → in progress → done.
4. Suspend and unsuspend a test shopper.
5. Read the traffic page after a few test clicks.

| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H7-6 | You can tell, from the drawer alone, whether a shopper confirmed their email, when they joined, and whether they are suspended | ☐ | ☐ | |
| H7-7 | The delete button is not next to a harmless button; a misclick is hard | ☐ | ☐ | |
| H7-8 | The privacy deadline (30 days; 45 for the US) is obvious and changes colour when close | ☐ | ☐ | |
| H7-9 | The CSV and JSON files you export open in Excel and a text editor without garbled Arabic (check the file encoding) | ☐ | ☐ | |
| H7-10 | You always know whether you are looking at **live** data or a **demo** screen (the page says so) | ☐ | ☐ | |
| H7-11 | The Settings tabs that are browser-only say so clearly; you are never fooled into thinking they changed the site | ☐ | ☐ | |
| H7-12 | The collapsed sidebar: hover it, click the logo to expand; cards never go on top of it | ☐ | ☐ | |
| H7-13 | On a 13-inch laptop screen, nothing needs sideways scrolling | ☐ | ☐ | |
| H7-14 | Signing out of the admin leaves no data visible when you press back | ☐ | ☐ | |

### 7.3 The analyst (read-only)
| ID | Check | Pass | Fail | Notes |
|---|---|:-:|:-:|---|
| H7-15 | An analyst sees numbers but never edit buttons; no way to reach the edit forms by the address bar | ☐ | ☐ | |
| H7-16 | If an analyst somehow opens an edit address, the screen says "no access" instead of showing a form | ☐ | ☐ | |

---

## 8. Messing with the system on purpose

You are trying to break it the way a curious teenager or a bad actor would. Stay inside the rules in section 0.1.

| ID | What to try | Expected | Pass | Fail | Notes |
|---|---|---|:-:|:-:|---|
| H8-1 | Change a product id in the address to another product's id | Normal "not found" or that product; never someone's private data | ☐ | ☐ | |
| H8-2 | Open the admin address when signed in as a **shopper** | "No access"; no admin data in the page source or Network tab | ☐ | ☐ | |
| H8-3 | In the Console, run what the site runs (`ACC.rest(...)`) to fetch another user's favorites | Empty or refused | ☐ | ☐ | |
| H8-4 | Edit the saved browser data (`doabno.auth`, favorites) to look like an admin | No admin features appear; the database refuses any write | ☐ | ☐ | |
| H8-5 | Replace your id with another user's id in a request | Refused | ☐ | ☐ | |
| H8-6 | Inspect the page source for secrets: keys, passwords, `service_role`, internal addresses, comments with credentials | None other than the public (publishable) key | ☐ | ☐ | |
| H8-7 | Check the Network tab during sign-up and sign-in | The password is only ever sent over `https` to Supabase, never in an address or logged text | ☐ | ☐ | |
| H8-8 | Try the sign-up form with a very long name, or 1,000 sign-ups in a loop on the throwaway project | Rate limit answers; the site stays up | ☐ | ☐ | |
| H8-9 | Try the privacy form 50 times | Either limited or accepted without breaking the admin list | ☐ | ☐ | |
| H8-10 | Click "Visit store" 200 times | Handled; check what it does to the admin traffic numbers | ☐ | ☐ | |
| H8-11 | Open `…/functions/v1/go` with random or missing parameters | Clean 4xx, never a redirect to a foreign site | ☐ | ☐ | |
| H8-12 | Disable JavaScript | The page says it needs JavaScript (a blank page is a fail) | ☐ | ☐ | |
| H8-13 | Block third-party images and fonts | The site stays readable, with placeholders | ☐ | ☐ | |
| H8-14 | Use an ad blocker and a strict privacy browser (Brave shields, Firefox strict) | The site works; sign-up works | ☐ | ☐ | |
| H8-15 | Use a VPN to another country | The site follows the chosen market, not a silent wrong guess | ☐ | ☐ | |
| H8-16 | Change the device clock a day forward, then a day back | The site still works | ☐ | ☐ | |
| H8-17 | Turn off cookies and local storage | The site tells you it cannot save things, or works without saving; no crash | ☐ | ☐ | |
| H8-18 | Open the site in a private window and sign in, close, reopen | Signed out (nothing leaked into the normal profile) | ☐ | ☐ | |
| H8-19 | Share a product link from a signed-in session with a friend | The link carries no private data (no token in the address) | ☐ | ☐ | |
| H8-20 | Take a screenshot of the admin Users page | Check how much personal data is visible by default and whether it should be masked | ☐ | ☐ | |

---

## 9. Closing questions (answer in words)

Write short answers. These matter as much as the ticks.

1. What was the **most annoying** thing you hit?
2. What was the **most confusing** screen, and what did you expect to see?
3. Was there a moment you **did not trust** the site, and why?
4. What would make you **leave** and never come back?
5. What would you **tell a friend** the site does, in one sentence?
6. What is missing that you **expected** to find?
7. Did any wording sound wrong in Arabic? (Quote it.)
8. Which page felt slowest, and on which device?
9. Anything that **worked well** and should not be changed?
10. Would you be comfortable using your real email and details here? Why or why not?

---

## 10. Sign-off

| Part | Tester | Date | Device(s) | Fails found | Result |
|---|---|---|---|---|---|
| 1 Cold-eyes | | | | | |
| 2 Journeys | | | | | |
| 3 Careless | | | | | |
| 4 Real phones | | | | | |
| 5 Two at once | | | | | |
| 6 Wording | | | | | |
| 7 Admin staff | | | | | |
| 8 Messing around | | | | | |
| 9 Closing questions | | | | | |

Launch only when `TESTING-MANUAL.md` passes **and** nothing here feels like a "no" to someone who has never seen the site.
