// The admin screens hide buttons using a permissions table (PERMS in admin-v2/admin.js). The database is what really enforces roles.
// This test reads both and fails if they disagree, so a role never sees a button the database would refuse (or loses one it is allowed).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

const adminJs = read('admin-v2/admin.js');
const permsSrc = adminJs.match(/const PERMS = (\{[\s\S]*?\});/)[1];
const PERMS = new Function('return ' + permsSrc)();

const schema = read('backend/supabase/migrations/0001_schema.sql');
const admin = read('backend/supabase/migrations/0004_admin.sql');
const rolesIn = list => list.match(/'(\w+)'/g).map(s => s.replace(/'/g, '')).sort();
// roles allowed to change a table, from `create policy "edit" on public.<table> for all using (public.has_role(array[...]))`
const editRoles = table => { const m = schema.match(new RegExp('create policy "edit" on public\\.' + table + ' for all using \\(public\\.has_role\\(array\\[([^\\]]+)\\]'));
  assert.ok(m, 'no edit policy for ' + table); return rolesIn(m[1]); };
const functionRoles = fn => { const body = admin.slice(admin.indexOf('function public.' + fn)); const m = body.match(/has_role\(array\[([^\]]+)\]/); assert.ok(m, 'no role check in ' + fn); return rolesIn(m[1]); };

test('products, categories, stores, coupons, feeds, rates: screen permissions match the database policies', () => {
  const pairs = [['product', 'products'], ['category', 'categories'], ['store', 'stores'], ['coupon', 'coupons'], ['feed', 'feeds'], ['rates', 'currencies']];
  pairs.forEach(([what, table]) => assert.deepEqual([...PERMS[what]].sort(), editRoles(table), what + ' vs ' + table));
});

test('popular searches, users list and team changes match the database functions', () => {
  assert.deepEqual([...PERMS.popular].sort(), functionRoles('set_popular_searches'));
  assert.deepEqual([...PERMS.users].sort(), functionRoles('admin_list_users'));
  assert.deepEqual([...PERMS.team].sort(), functionRoles('admin_add_member'));
});

test('every role named anywhere is one of the four real roles', () => {
  const real = ['analyst', 'catalog', 'owner', 'partners'];
  Object.values(PERMS).flat().forEach(r => assert.ok(real.includes(r), r));
  assert.deepEqual(rolesIn(schema.match(/role text not null check \(role in \(([^)]+)\)\)/)[1]), real);
});
