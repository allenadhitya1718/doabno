// Sends email through Resend (resend.com). Needs RESEND_API_KEY and an address on a domain verified in Resend (ALERT_FROM).
// Free plan: 100 emails a day, 3,000 a month.
function createResendMailer({ apiKey = process.env.RESEND_API_KEY, from = process.env.ALERT_FROM, fetchImpl = fetch } = {}) {
  if (!apiKey || !from) throw new Error('RESEND_API_KEY and ALERT_FROM are required');
  return {
    // Resolves when Resend accepted the message; throws (with Resend's message) when it refused.
    async send({ to, subject, html, text, headers }) {
      const res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, html, text, headers })
      });
      if (!res.ok) { let m = ''; try { m = (await res.json()).message || ''; } catch (e) { /* not JSON */ } throw new Error('Resend refused the email (HTTP ' + res.status + ') ' + m); }
    }
  };
}
module.exports = { createResendMailer };
