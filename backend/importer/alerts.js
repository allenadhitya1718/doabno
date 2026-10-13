// Price-drop alerts: email people whose target price has been reached, once, and arm the alert again when the price rises back.
// Rules, in plain words:
//   - only alerts with email on AND a recorded consent time are emailed (the consent tick in the alert form);
//   - the price compared is the lowest in-stock total (price + shipping) in the person's market, converted to the alert's currency;
//   - one email when the price first reaches the target; no more until the price has gone above the target and come back;
//   - at most `max` emails per run (Resend's free plan allows 100 a day); the rest wait for the next run.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SYMBOL = { SAR: { en: 'SAR', ar: 'ر.س' }, AED: { en: 'AED', ar: 'د.إ' }, USD: { en: '$', ar: '$' }, GBP: { en: '£', ar: '£' } };
function money(amount, currency, lang) {
  const n = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const sym = (SYMBOL[currency] || { en: currency, ar: currency })[lang === 'ar' ? 'ar' : 'en'];
  return sym === '$' || sym === '£' ? sym + n : lang === 'ar' ? n + ' ' + sym : sym + ' ' + n;
}

function buildEmail(a, { siteUrl, price, lang }) {
  const name = lang === 'ar' ? a.name_ar : a.name_en;
  const link = siteUrl.replace(/\/$/, '') + '/#/p/' + encodeURIComponent(a.product_id);
  const manage = siteUrl.replace(/\/$/, '') + '/#/alerts';
  const now = money(price, a.currency, lang), target = money(a.target_price, a.currency, lang);
  if (lang === 'ar') {
    const subject = 'انخفض سعر ' + name + ' إلى ' + now;
    const text = ['وصل سعر ' + name + ' إلى هدفك.', 'أقل سعر الآن: ' + now + ' (هدفك: ' + target + ')', 'شاهد الأسعار: ' + link, '', 'تصلك هذه الرسالة لأنك أنشأت تنبيه سعر في دوابنو ووافقت على استلامه. لإدارة التنبيهات أو إيقافها: ' + manage].join('\n');
    const html = '<div dir="rtl" style="font-family:Arial,sans-serif;color:#172B3A;max-width:520px"><h2 style="color:#0D2942">انخفض السعر إلى هدفك</h2><p><b>' + esc(name) + '</b></p><p style="font-size:22px;margin:8px 0"><b>' + esc(now) + '</b></p><p style="color:#526272">هدفك: ' + esc(target) + '</p><p><a href="' + esc(link) + '" style="display:inline-block;background:#0D2942;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">شاهد الأسعار</a></p><p style="color:#526272;font-size:12px">تصلك هذه الرسالة لأنك أنشأت تنبيه سعر في دوابنو ووافقت على استلامه. <a href="' + esc(manage) + '">إدارة التنبيهات أو إيقافها</a></p></div>';
    return { subject, text, html };
  }
  const subject = name + ' dropped to ' + now;
  const text = [name + ' has reached your target price.', 'Lowest price now: ' + now + ' (your target: ' + target + ')', 'See the prices: ' + link, '', 'You get this email because you set a price alert on DOABNO and agreed to receive it. Manage or turn off your alerts: ' + manage].join('\n');
  const html = '<div style="font-family:Arial,sans-serif;color:#172B3A;max-width:520px"><h2 style="color:#0D2942">Your price alert was reached</h2><p><b>' + esc(name) + '</b></p><p style="font-size:22px;margin:8px 0"><b>' + esc(now) + '</b></p><p style="color:#526272">Your target: ' + esc(target) + '</p><p><a href="' + esc(link) + '" style="display:inline-block;background:#0D2942;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">See the prices</a></p><p style="color:#526272;font-size:12px">You get this email because you set a price alert on DOABNO and agreed to receive it. <a href="' + esc(manage) + '">Manage or turn off your alerts</a>.</p></div>';
  return { subject, text, html };
}

// db: getAlertCandidates(), getRates(), markAlert(id, triggeredAtIsoOrNull). mailer: send({to, subject, html, text}).
async function checkAlerts({ db, mailer, siteUrl, max = 80, dryRun = false, log = () => {} }) {
  const rates = await db.getRates();
  const rows = await db.getAlertCandidates();
  const out = { checked: rows.length, sent: 0, rearmed: 0, skipped: { noConsent: 0, noEmail: 0, noPrice: 0, waiting: 0, capped: 0 }, failed: 0 };
  for (const a of rows) {
    if (a.lowest == null) { out.skipped.noPrice++; continue; }
    // lowest price in the market's currency -> the alert's currency
    const price = a.market_currency === a.currency ? Number(a.lowest) : Number(a.lowest) / rates[a.market_currency] * rates[a.currency];
    const reached = price <= Number(a.target_price) + 1e-9;
    if (!reached) {
      if (a.triggered_at) { if (!dryRun) await db.markAlert(a.alert_id, null); out.rearmed++; }   // price is back above the target: arm again
      continue;
    }
    if (a.triggered_at) { out.skipped.waiting++; continue; }                                         // already told them about this drop
    if (!a.notify_email) { out.skipped.noEmail++; continue; }
    if (!a.consent_at) { out.skipped.noConsent++; continue; }
    if (out.sent >= max) { out.skipped.capped++; continue; }
    const mail = buildEmail(a, { siteUrl, price: Math.round(price * 100) / 100, lang: a.lang === 'ar' ? 'ar' : 'en' });
    if (dryRun) { log('would email ' + a.email + ': ' + mail.subject); out.sent++; continue; }
    try {
      await mailer.send({ to: a.email, subject: mail.subject, html: mail.html, text: mail.text });
      await db.markAlert(a.alert_id, new Date().toISOString());   // only after the email was accepted, so a failure is retried next run
      out.sent++;
    } catch (e) { out.failed++; log('email failed for alert ' + a.alert_id + ': ' + e.message); }
  }
  return out;
}

module.exports = { checkAlerts, buildEmail, money };
