const CACHE = 'yard-work-tracker-v4';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const isPage = request.mode === 'navigate' || request.destination === 'document';

  if (isPage) {
    event.respondWith(
      fetch(request).then(response => {
        if (!response.ok) return response;
        return response.text().then(html => {
          const patch = `<script>
            (function(){
              const originalComplete = window.complete;
              if (typeof originalComplete !== 'function') return;
              window.complete = function(index) {
                const stayOnTasks = (document.getElementById('screen')?.textContent || '').includes('Manage Tasks');
                originalComplete(index);
                if (stayOnTasks) manage();
              };
            })();
          <\\/script>`;
          const updated = html.includes('</body>') ? html.replace('</body>', patch + '</body>') : html + patch;
          return new Response(updated, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        });
      }).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
