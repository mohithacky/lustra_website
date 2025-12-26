'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "a9eef0ccf31366a3f4ccddddf7d489f2",
"assets/AssetManifest.bin.json": "4f61f7fb6f39a1bac76d799fda2387d2",
"assets/AssetManifest.json": "114f6bf10fc0389310a52a029aeac969",
"assets/assets/categories/bangles.png": "97a717acaa7ce9b2d076e751b6171076",
"assets/assets/categories/bracelet.png": "ab0dfc208f464faf3f9e2a700b22ac2b",
"assets/assets/categories/chain.png": "37e2571f4e1d12475c44fadc72e120fc",
"assets/assets/categories/choker.jpg": "0e431c0ce9a823e9b1a12c57e4d29188",
"assets/assets/categories/dholna.png": "27cf876ba16821b840fa6cf337aae39f",
"assets/assets/categories/earrings.png": "018ca2a78a58830071b306f551b17642",
"assets/assets/categories/long_necklace.png": "eb173c3e516e9909c83306c0456a3031",
"assets/assets/categories/mangtika.png": "33b18a1361e7a468e6f4dd20148fe748",
"assets/assets/categories/necklace.png": "f68ed2e758ad861904bb3871bf8251d9",
"assets/assets/categories/pendant.png": "cc5a4fb4fc5563164979069d24b95f32",
"assets/assets/categories/ring.jpg": "1f9921130dc19544660c56f19ede2be8",
"assets/assets/categories/ring.png": "673a8d951587945f7c8ae75af325e6bc",
"assets/assets/collections/0cea2fd72df3d1c26f6ea6d76e447a09.jpg": "d65ad8ea010cc7c3a8a3586ba2bcb8b3",
"assets/assets/collections/34513-1.webp": "df05f1d95ece90cba7ca4b389330a7ca",
"assets/assets/collections/Classic.jpg": "5a1d2fb1b35072c7c3cdde3fd75cd0a0",
"assets/assets/collections/d77737cae1098d5453573c53250f0d1c.jpg": "a389a56965baac39280f422d703e0844",
"assets/assets/collections/download.png": "2771c61e7146746f16dc1f6f3554dc06",
"assets/assets/collections/Heritage.jpg": "f5a30b2c5de4ecd28469b3de29b28bff",
"assets/assets/collections/Luxury.jpg": "f5a469ace89a5cd57a31cfc8781d4098",
"assets/assets/collections/Minimal.jpg": "896c14c4ac19dd0ed8b467884c09e2b1",
"assets/assets/gender/anniversary.jpg": "6bf4ea79fe473a261409cdf4c1617742",
"assets/assets/gender/birthday.jpg": "647b2921a6a9f5728241f81e7f48aef1",
"assets/assets/gender/Classic.jpg": "3f44a2db5e31ceacdb6f71fe744615a0",
"assets/assets/gender/Cute%2520and%2520Classy.jpg": "518bb66e09c554a35de83da2d01a062b",
"assets/assets/gender/Elegant.jpg": "840954bd742a5f4228b60f0b35ae9d1f",
"assets/assets/gender/her.jpg": "56ce7fe71d7ac0660ac42cb8bc48c63b",
"assets/assets/gender/him.jpg": "640110dd2fc06963777c47cd3d6452b1",
"assets/assets/gender/most_gifted.jpg": "eab25c6c4aa5f00171ca435976126c65",
"assets/assets/gender/Party%2520Perfect.jpg": "6d71454d4d0e1f7182e90d8bd8d18e84",
"assets/assets/gender/unnamed.jpg": "7424f484164233adfaa803c716866b9b",
"assets/assets/gender/Wedding.jpg": "9924c57868152329927e3ce38e1d7569",
"assets/assets/images/a.jpg": "059f7b7d4fe59021adda0f4fcbf8596b",
"assets/assets/images/baali.jpg": "50ab50082e6f63edc426104914eeeb58",
"assets/assets/images/bangles.jpg": "9958271a70ca21ad9c4627562ff349e4",
"assets/assets/images/belt_necklace.jpg": "8660d2e6bbaf32fb6ba89a7862588843",
"assets/assets/images/bracelet.jpg": "d19e434b00201202533a8e7c793fb4b0",
"assets/assets/images/chain.jpg": "32ea816ae1f894ada710c5185bfdc417",
"assets/assets/images/choker.jpg": "1f0ce593d92c33f57626e84403a85663",
"assets/assets/images/dholna.jpg": "9dc9021e656e00bbacbd6c267af48936",
"assets/assets/images/earrings.jpg": "aaa85799bff0933cb63aea16eb1e4e98",
"assets/assets/images/flappy.jpg": "9533dcb84cf9450d91a1616008af34d6",
"assets/assets/images/google_logo.png": "a983993df2de3816ac6a38b3be9f2c7f",
"assets/assets/images/logo.jpg": "e47a05d9290766f2b6042fd79e4bcada",
"assets/assets/images/logo.png": "39fca1c62e3915a60bcf9c2097ca050f",
"assets/assets/images/long_necklace.jpg": "e24bc24aad7e98d9da2e77f31f44105a",
"assets/assets/images/mangtika.jpg": "f31cfa5e5d24ee9356649217560b787a",
"assets/assets/images/m_pendant.jpg": "a254b549b482991890ca73d9e348907c",
"assets/assets/images/nathia.jpg": "30a6bf676bf16f2148a215671ceb3467",
"assets/assets/images/necklace.jpg": "a79ed958b3304481c6c8040bf477a669",
"assets/assets/images/pendant.jpg": "d55e7d5ee8b6a9bc1bf45a0c78241a9d",
"assets/assets/images/ring.jpg": "6622d4f31c8b2c76797fcba371e51247",
"assets/assets/images/unnamed%2520(1).jpg": "d0fe8f920d0c3693a94aaf1606c56cdd",
"assets/assets/images/unnamed%2520(10).jpg": "3667d2ae7726a105e3dfd5d01141b3f0",
"assets/assets/images/unnamed%2520(11).jpg": "bd79e5a13205bc806fb25483cd258808",
"assets/assets/images/unnamed%2520(12).jpg": "cf4d9088dd46cc7e1b3923aa923d7089",
"assets/assets/images/unnamed%2520(13).jpg": "03b08bf5563caa15961deb08df6774fa",
"assets/assets/images/unnamed%2520(2).jpg": "a6f1c23185bd3601d3bff787d24d8d29",
"assets/assets/images/unnamed%2520(3).jpg": "0e848ba72198a71478caaf4b37f8d10d",
"assets/assets/images/unnamed%2520(4).jpg": "150321acaca3993fe6bc5052ebee555f",
"assets/assets/images/unnamed%2520(5).jpg": "93f77c8facde0572d7d6337a896b43e8",
"assets/assets/images/unnamed%2520(6).jpg": "28340da99c41ed0a066ed6419328d0f7",
"assets/assets/images/unnamed%2520(7).jpg": "c30fc0575b8c9dba50637607b54ea018",
"assets/assets/images/unnamed%2520(8).jpg": "18a889d8af753407af0424b60b368aed",
"assets/assets/images/unnamed%2520(9).jpg": "4592f3f2c87af1e74219a4c14118df4e",
"assets/assets/images/unnamed.jpg": "b28ed0551f652e0fda3bd56729b53204",
"assets/assets/images/unnamed.png": "51ca694288354f78ca67bf042eada108",
"assets/assets/white/11to14.jpg": "87f18d0df10831dee9b0c557fd77d96c",
"assets/assets/white/16to9.avif": "0297a1943b47048c84b7bd7a2b48468a",
"assets/assets/white/1to1.jpg": "d65ad8ea010cc7c3a8a3586ba2bcb8b3",
"assets/assets/white/80bd1dc4-b719-4944-9ee6-224586088de8.png": "6c11e4b71622e358e6e2d16c1af0a67c",
"assets/assets/white/840ce41eab3d32b600236bec07006f9b.jpg": "be7b534c41bd3554a2a1881638449f78",
"assets/assets/white/8c244012-76ef-41cb-8c25-d3ddb0643ef1.png": "4fd5c7f0a0b78de3ccc3f432fa6a78a6",
"assets/assets/white/8fc3e4d2-9249-4400-a884-0601d6d6c3b3.png": "3397393889af4b0987e6c07f1ce55616",
"assets/assets/white/a0409404-d2a9-43a4-9d0e-d348e331dcc5.png": "a445592f3d17d3dd9d93bd02c1a1ffd5",
"assets/assets/white/bae2fe6a-96e9-407a-a86c-e561a931f156.png": "af6c69ff45202f75e297567ae4bf545a",
"assets/assets/white/bracelet.png": "7c67d170ae9084220067b95a889ec932",
"assets/assets/white/choker.png": "4db8913e41267b71bb995c7bb7270af9",
"assets/assets/white/diamond.jpg": "700689cf576ee300f4f37e31a20562e2",
"assets/assets/white/gold.jpg": "3b8922a912fcdc20e967720454435532",
"assets/assets/white/long_necklace.png": "ec79afc568273419ecf76ed83bfca51a",
"assets/assets/white/mangalsutra_pendant.png": "0d691db5012ecb7843f6464782032420",
"assets/assets/white/silver.jpg": "05ac5909fbe186f826adc0524826235d",
"assets/FontManifest.json": "5a32d4310a6f5d9a6b651e75ba0d7372",
"assets/fonts/MaterialIcons-Regular.otf": "ee9dc7630d1549cc2625824053456843",
"assets/NOTICES": "4dc4cdab629f6a5a698c583d0ed30f23",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/packages/font_awesome_flutter/lib/fonts/fa-brands-400.ttf": "a91c37bdc4bb3b5087c10ac6c36ad9c9",
"assets/packages/font_awesome_flutter/lib/fonts/fa-regular-400.ttf": "f3307f62ddff94d2cd8b103daf8d1b0f",
"assets/packages/font_awesome_flutter/lib/fonts/fa-solid-900.ttf": "04f83c01dded195a11d21c2edf643455",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"canvaskit/canvaskit.js": "728b2d477d9b8c14593d4f9b82b484f3",
"canvaskit/canvaskit.js.symbols": "bdcd3835edf8586b6d6edfce8749fb77",
"canvaskit/canvaskit.wasm": "7a3f4ae7d65fc1de6a6e7ddd3224bc93",
"canvaskit/chromium/canvaskit.js": "8191e843020c832c9cf8852a4b909d4c",
"canvaskit/chromium/canvaskit.js.symbols": "b61b5f4673c9698029fa0a746a9ad581",
"canvaskit/chromium/canvaskit.wasm": "f504de372e31c8031018a9ec0a9ef5f0",
"canvaskit/skwasm.js": "ea559890a088fe28b4ddf70e17e60052",
"canvaskit/skwasm.js.symbols": "e72c79950c8a8483d826a7f0560573a1",
"canvaskit/skwasm.wasm": "39dd80367a4e71582d234948adc521c0",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"flutter.js": "83d881c1dbb6d6bcd6b42e274605b69c",
"flutter_bootstrap.js": "1280faba492658d62a6593e22c59cef0",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"index.html": "f14fad47f3d82b3b87ea00e5223c0585",
"/": "f14fad47f3d82b3b87ea00e5223c0585",
"main.dart.js": "4a3f247a3c99fa6265f66876626bc84c",
"manifest.json": "d557152b40cc99cf3cca6921a88a8afa",
"version.json": "1d6b83c5fbeb2f31074160c33cf4fedb"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
