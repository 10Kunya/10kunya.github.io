// ตัวช่วยของหน้าลูกค้า (book/) — มีไว้ให้ Chrome ยอมติดตั้งเป็นไอคอนบนหน้าจอ ไม่ได้เก็บแคชอะไร
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
