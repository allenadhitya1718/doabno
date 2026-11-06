/* Lists of text keys that server components pick (with dict()) and pass to client components.
 * They live here, not in the 'use client' files, because a server component importing a value from a client module gets a reference, not the array. */

export const CHROME_KEYS = ['tab.home', 'tab.search', 'tab.deals', 'tab.alerts', 'tab.saved', 'cookie.text', 'cookie.ess', 'cookie.all'];

export const LISTING_KEYS = ['filters', 'sort', 's.rel', 's.pop', 's.price', 's.drop', 's.rating', 'fStore', 'fBrand', 'fPrice', 'fOpts', 'min', 'max', 'fFree', 'fStock', 'clear', 'showMore', 'none', 'noneD', 'resultsN'];

export const NAV_KEYS = ['nav.cats', 'deals', 'alerts', 'favsNav', 'foot.aboutUs', 'coupons', 'nav.all', 'alertsE', 'favsE', 'target', 'now', 'from'];

export const PREFS_KEYS = ['marketHd', 'currencyLbl', 'lang', 'signin', 'soon'];
export const VIZ_KEYS = ['viz.s0', 'viz.s1', 'viz.s2', 'viz.s3', 'viz.s4', 'viz.low', 'viz.save', 'viz.more', 'viz.drop', 'viz.today', 'viz.alt', 'viz.buy', 'bestTag'];

export const SAVED_KEYS = ['favsT', 'alertsT', 'sv.favsSub', 'alertsD', 'sv.emptyF', 'sv.emptyA', 'sv.emptyFd', 'sv.emptyAd', 'sv.browse', 'sv.nDrops', 'sv.lowest', 'sv.nReached', 'sv.closest',
  'sv.nSaved', 'sv.nAlerts', 'sv.unsave', 'al.reachedT', 'al.below', 'al.above', 'al.view', 'remove', 'now', 'target'];

export const SEARCH_KEYS = ['search.ph', 'search.hero', 'tab.search', 'recent', 'popular', 'sProducts', 'sBrands', 'sStores', 'searchFor', 'stores', 'store1'];
export const CARD_KEYS = ['stores', 'store1', 'usually', 'lessN', 'viz.buyNow', 'compare', 'dropTag', 'drop.vs'];

/** Text for sign-in, the auth dialog, the account page and sync messages (picked on the server and passed to AccountProvider). */
export const ACCOUNT_KEYS = ['signin', 'siTitle', 'siGo', 'siDone', 'email', 'pass', 'ac.signup', 'ac.name', 'ac.have', 'ac.new', 'ac.live', 'ac.demo', 'ac.pw8', 'ac.consent', 'ac.marketing',
  'foot.terms', 'foot.privacy', 'ac.err', 'ac.errName', 'ac.errAuth', 'ac.errConfirm', 'ac.errExists', 'ac.errWeak', 'ac.errRate', 'ac.errNet', 'ac.errGeneric', 'ac.checkMail', 'ac.signedUp',
  'ac.or', 'ac.google', 'ac.apple', 'ac.confirmed', 'ac.errLink', 'ac.syncErr', 'ac.needSignIn', 'ac.title', 'ac.hello', 'ac.signout', 'ac.prefs', 'ac.notif', 'ac.promo', 'ac.saved',
  'ac.data', 'ac.dataD', 'ac.export', 'ac.delete', 'ac.confirmDel', 'ac.deleted', 'favsT', 'alertsT', 'favsNav', 'alerts', 'pr.errSend'];
