const CACHE = 'yard-work-tracker-v15';
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
          let updated = html.replace(
            '</head>',
            '<style>.nav{position:fixed!important;bottom:0;left:0;right:0}.main{padding-bottom:100px!important}.cat{align-items:center!important;text-align:center!important}.cat .cat-title,.cat small{width:100%;text-align:center}.sheetbg{z-index:10}</style></head>'
          );

          // Add the modal to pages that do not yet contain it. Insert before
          // </body> so this works regardless of whitespace or closing-div layout.
          if (!updated.includes('id="bg"')) {
            updated = updated.replace(
              '</body>',
              '<div class="sheetbg" id="bg" onclick="closeSheet(event)"><div class="sheet" id="sheet" onclick="event.stopPropagation()"></div></div><script>window.closeSheet=window.closeSheet||function(e){var bg=document.getElementById("bg");if(!bg)return;if(e&&e.target!==bg)return;bg.style.display="none";};</script></body>'
            );
          }

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
