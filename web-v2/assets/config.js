/* Where the pages get their catalog. Leave supabaseUrl and anonKey empty to use the built-in demo data.
 *   supabaseUrl + anonKey: the Supabase project URL and its publishable key. Both are meant to be public.
 *   catalogUrl: a JSON file with the same shape as get_catalog() (for trying things without a database).
 *   clickOutUrl: the address of the "go" function (https://<project>.supabase.co/functions/v1/go). When set, "Visit store" buttons for offers
 *     that have a store link open it: the function logs the click, then sends the visitor to the store. Leave empty until it is deployed.
 *   socialLogin: providers switched on in Supabase, for example ['google', 'apple']. Their buttons then appear; leave empty until set up.
 * Never put a service_role key or a database password in this file. */
window.DOABNO_CONFIG = {
  supabaseUrl: 'https://hmanlftkhvruqgvkencn.supabase.co',
  anonKey: 'sb_publishable_-bpLYU0crmM1-amgU5sjjQ_EOhLHipA',
  catalogUrl: '',
  clickOutUrl: '',
  socialLogin: []
};
