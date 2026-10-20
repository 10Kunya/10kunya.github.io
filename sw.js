// ตัวรับแจ้งเตือนของหน้าช่าง — เซิร์ฟเวอร์ส่งแจ้งเตือนเปล่า แล้วตัวนี้ดึงคิวล่าสุดมาแสดงเอง
const API_URL = 'https://script.google.com/macros/s/AKfycbxikYAE-wSNLOwdfVX2vK9Em2K1RQ-oap9v9WsbMzxUCD0PcSSpfxBRWHtXtjoZhPW8/exec';
const WD = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const dShort = ds => { const p = ds.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2])); return WD[d.getUTCDay()] + ' ' + p[2] + ' ' + MO[p[1] - 1]; };

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => e.waitUntil(show()));
const OPTS = { icon: 'icon-192.png', badge: 'icon-192.png', tag: 'k10-new' };
async function show() {
  // 1) แสดงทันที — iPhone จะตัดการทำงานถ้าไม่แสดงแจ้งเตือนเร็ว
  await self.registration.showNotification('คิวลูกค้ามีความเคลื่อนไหว', Object.assign({ body: 'แตะเพื่อดูตารางคิว', renotify: true, vibrate: [200, 100, 200] }, OPTS));
  // 2) ถ้าดึงชื่อลูกค้าได้ภายใน 5 วินาที ค่อยเปลี่ยนข้อความ (ไม่สั่นซ้ำ)
  try {
    const hit = await (await caches.open('k10')).match('sess');
    const sess = hit && await hit.text();
    if (!sess) return;
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ fn: 'barberNewest', args: [sess] }), credentials: 'omit', signal: ctl.signal });
    clearTimeout(t);
    const n = (await r.json()).result;
    if (!n) return;
    const k = n.kind || 'new', f = n.from || {};
    const title = { new: 'จองใหม่', move: 'ลูกค้าเลื่อนคิว', cancel: 'ลูกค้ายกเลิกคิว', edit: 'ลูกค้าแก้ข้อความ' }[k] || 'คิวเปลี่ยน';
    const when = k === 'move' ? dShort(f.date) + ' ' + f.time + ' → ' + (f.date === n.date ? '' : dShort(n.date) + ' ') + n.time : dShort(n.date) + ' · ' + n.time;
    await self.registration.showNotification(title + ' · ' + n.name, Object.assign({ body: when + (n.note && k !== 'cancel' ? '\n💬 ' + n.note : ''), renotify: false, silent: true }, OPTS));
  } catch (err) {}
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => new URL(c.url).pathname === new URL(self.registration.scope).pathname);
    return w ? w.focus() : self.clients.openWindow(self.registration.scope);
  }));
});
