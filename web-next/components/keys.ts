/* Lists of text keys that server components pick (with dict()) and pass to client components.
 * They live here, not in the 'use client' files, because a server component importing a value from a client module gets a reference, not the array. */

export const CHROME_KEYS = ['tab.home', 'tab.search', 'tab.deals', 'tab.alerts', 'tab.saved', 'cookie.text', 'cookie.ess', 'cookie.all'];

export const LISTING_KEYS = ['filters', 'sort', 's.rel', 's.pop', 's.price', 's.drop', 's.rating', 'fStore', 'fBrand', 'fPrice', 'fOpts', 'min', 'max', 'fFree', 'fStock', 'clear', 'showMore', 'none', 'noneD', 'resultsN'];

export const NAV_KEYS = ['nav.cats', 'deals', 'alerts', 'favsNav', 'foot.aboutUs', 'coupons', 'nav.all', 'alertsE', 'favsE', 'target', 'now', 'from'];

export const PREFS_KEYS = ['marketHd', 'lang', 'signin', 'soon'];

export const SAVED_KEYS = ['favsT', 'alertsT', 'sv.favsSub', 'alertsD', 'sv.emptyF', 'sv.emptyA', 'sv.emptyFd', 'sv.emptyAd', 'sv.browse', 'sv.nDrops', 'sv.lowest', 'sv.nReached', 'sv.closest',
  'sv.nSaved', 'sv.nAlerts', 'sv.unsave', 'al.reachedT', 'al.below', 'al.above', 'al.view', 'remove', 'now', 'target'];

export const SEARCH_KEYS = ['search.ph', 'search.hero', 'tab.search', 'recent', 'popular', 'sProducts', 'sBrands', 'sStores', 'searchFor', 'stores', 'store1'];
export const CARD_KEYS = ['stores', 'store1', 'usually', 'lessN', 'viz.buyNow', 'compare', 'dropTag', 'drop.vs'];
