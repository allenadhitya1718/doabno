# moretests.md: results (automated run, 2026-10-17)

Run on the Android emulator (Android 17, 411 px wide) against the live catalogue, website and installed Android app. Nothing was written to the live database (no sign-ups, no admin edits, no form submissions). Scripted checks measure what a person would see; the "felt" judgements (is it pleasant, is the Arabic natural) still need a human.

Legend: PASS, FAIL (should be fixed), NOTE (works, but worth a look).

## Part 1 and 2: first impression and journeys (website)
| Row | Result | Detail |
|---|---|---|
| H1-1/2/6 first screen | PASS | Search box is in the first screen (287 px from top), language button visible, one clear H1, placeholder fits. |
| H1-4/5 product page | NOTE | "Best total price" label present. No sentence saying delivery is included. |
| H1-5 affiliate disclosure | FAIL | The commission/affiliate wording is only in the footer, not near "Visit store" on the product page. |
| H2-1 Arabic vs English | FAIL (small) | "headphones" and the Arabic word give identical results. Arabic "سوني" does not find the PS5 Pro that English "sony" finds (brand search in Arabic). |
| Offers freshness | FAIL | Shows "Checked 5182 min ago". Stale data, and the wording should switch to hours/days. |
| H2-11/12 tap targets | FAIL | Header controls are small (language button 32x20, Sign in 67x20, selects about 25 px high). 23 to 31 targets under 40 px per page. No icon-only control lacks a name (PASS). |
| H2-14 200% text | PASS | No sideways scroll on 5 pages. |
| H2-9/10 currency | PASS | SAR 1,413 to $377 and back to SAR 1,413 exactly. Second tab fine. |
| H2-15/16 slow 3G | FAIL | Nothing visible for about 11.5 s, then headline and products appear together. Layout shift score 0.18 (above the 0.1 target). A loading state would help. |
| H2-17 offline search | PASS | Calm message, no technical words. |
| H2-18 privacy / CCPA | PASS | Links in the footer on every page checked. |

## Part 3: careless and impatient behaviour (website)
| Row | Result | Detail |
|---|---|---|
| H3-1 heart x5 / alert x5 | PASS | One favourite stored, count 1; one dialog. |
| H3-9 odd prices | PASS | Inputs are number type; `1,299`, Arabic digits, `SAR 50`, `5e2` never produce NaN or errors. |
| H3-12 autofill | PASS (NOTE) | name/email/new-password attributes right. Input text is 15 px, below 16 px, so iPhone Safari zooms into the field. |
| H3-13 screen off 6 s | PASS | Page recovered. |
| H3-14 12 tabs | PASS | All loaded. |
| H3-15 empty search x3 | PASS | No errors. |
| H3-16 open/back x20 | PASS | No errors, heap not growing. |
| H3-17 links | NOTE | Product cards are real links; "Visit store" is a button (cannot open in a new tab by long-press). |
| H3-19 closing dialogs | FAIL (small) | Escape and click-outside close it. Browser Back does not close it (stays on the page, dialog open). |
| H3-20 logo | PASS | Logo goes to `#/`. |

## Part 4: phone conditions (installed Android app)
| Row | Result | Detail |
|---|---|---|
| H4-2 input size | PASS (app) | App inputs are 16 px. See website note above. |
| H4-4 rotate mid-form | NOTE | Script could not read the form (test signed in, form not open); landscape screenshot saved in the run, no layout break seen. Re-check by hand. |
| H4-5 safe areas | PASS | `viewport-fit=cover`, tab bar bottom padding 28 px, app bar top padding 29 px. |
| H4-11 airplane mode | PASS | Cached deals still listed; photo search gives a clear message ("couldn't identify this photo right now... type the number below"); search works again after reconnect. |
| H4-13 dark mode | NOTE | Phone in dark mode: the app stays light (background stays light). Readable, no dark theme. 1 or 2 low-contrast text spots (ratio 2.4). |
| H4-14 font 1.3x | PASS (NOTE) | No sideways scroll; 4 buttons clip their text. |
| H4-16 battery saver | PASS | Deals load normally. |
| H4-19 interruption | PASS | Sheet still open after another app took the screen for 5 s. |
| H4-20 phone in Arabic | PASS | App follows the phone: lang `ar`, right-to-left. |
| H4-21 console errors | PASS | Only the expected offline failure. |
| H4-22 2G-like | PASS | Product title shown in 1.5 s. |

## Part 6 and 8: wording and hostile checks
| Row | Result | Detail |
|---|---|---|
| Placeholder text scan | PASS | No lorem, TODO, TBD or template markers in site/app strings. |
| `go` function with bad input | PASS | Missing id, odd id, path tricks and SQL-looking text all return clean 400/403, never 500. |
| `identify` function | PASS | GET gives 405, unsigned bad JSON gives 401. |
| Secrets in pages | PASS | Only the publishable key; the words "service_role" appear only in warning comments. |
| No-JavaScript page | NOTE | No `<noscript>` message in any of the three pages; a visitor without JavaScript sees a blank page. |

## Part 9: closing answers
- Would I trust it with my money? The prices and flow are clear; the missing affiliate wording on the product page and the "Checked 5182 min ago" line would make me hesitate.
- Biggest annoyance: nothing on screen for about 11 s on a slow connection.
- Best thing: Arabic/English parity, offline calm, and the photo search fallback messages.

## Suggested fixes (not done, awaiting go-ahead)
1. Affiliate disclosure near "Visit store" on the product page.
2. Larger header tap targets (minimum 40 px).
3. Loading skeleton for slow networks; reduce layout shift.
4. Freshness wording in hours/days; investigate why offers are 3.6 days old.
5. Arabic brand names in search (سوني).
6. Website inputs 16 px; Back button closes dialogs; `<noscript>` message.
