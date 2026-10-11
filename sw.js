// ตัวรับแจ้งเตือนของหน้าช่าง — เซิร์ฟเวอร์ส่งแจ้งเตือนเปล่า แล้วตัวนี้ดึงคิวล่าสุดมาแสดงเอง
const API_URL = 'https://script.google.com/macros/s/AKfycbxikYAE-wSNLOwdfVX2vK9Em2K1RQ-oap9v9WsbMzxUCD0PcSSpfxBRWHtXtjoZhPW8/exec';
const WD = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const dShort = ds => { const p = ds.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2])); return WD[d.getUTCDay()] + ' ' + p[2] + ' ' + MO[p[1] - 1]; };

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => e.waitUntil(show()));
async function show() {
  let title = 'มีคิวจองใหม่', body = 'แตะเพื่อดูตารางคิว';
  try {
    const hit = await (await caches.open('k10')).match('sess');
    const sess = hit && await hit.text();
    if (sess) {
      const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ fn: 'barberNewest', args: [sess] }), credentials: 'omit' });
      const n = (await r.json()).result;
      if (n) { title = 'จองใหม่ · ' + n.name; body = dShort(n.date) + ' · ' + n.time; }
    }
  } catch (err) {}
  return self.registration.showNotification(title, {
    body: body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'k10-new', renotify: true, vibrate: [200, 100, 200]
  });
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => new URL(c.url).pathname === new URL(self.registration.scope).pathname);
    return w ? w.focus() : self.clients.openWindow(self.registration.scope);
  }));
});
