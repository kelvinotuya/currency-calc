importScripts('js/idb.js');

//var dbPromise;
var idbcurrencies;

function createDB() {
	/*dbPromise = idb.open('currency-db', 1, function(upgradeDB) {
		console.log(upgradeDB);
		//if (upgradeDB.objectStoreNames.contains('currencies')) {
			upgradeDB.creatObjectStore('currencies');
		//}
	});*/
	const dbPromise = idb.open('currency-db', 1, upgradeDB => {
		upgradeDB.createObjectStore('currencies');
	  });

	   idbcurrencies = {
		get(key) {
		  return dbPromise.then(db => {
			return db.transaction('currencies')
			  .objectStore('currencies').get(key);
		  });
		},
		set(key, val) {
		  return dbPromise.then(db => {
			const tx = db.transaction('currencies', 'readwrite');
			tx.objectStore('currencies').put(val, key);
			return tx.complete;
		  });
		},
		delete(key) {
		  return dbPromise.then(db => {
			const tx = db.transaction('currencies', 'readwrite');
			tx.objectStore('currencies').delete(key);
			return tx.complete;
		  });
		},
		clear() {
		  return dbPromise.then(db => {
			const tx = db.transaction('currencies', 'readwrite');
			tx.objectStore('currencies').clear();
			return tx.complete;
		  });
		},
		keys() {
		  return dbPromise.then(db => {
			const tx = db.transaction('currencies');
			const keys = [];
			const store = tx.objectStore('currencies');
	  
			// This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
			// openKeyCursor isn't supported by Safari, so we fall back
			(store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
			  if (!cursor) return;
			  keys.push(cursor.key);
			  cursor.continue();
			});
	  
			return tx.complete.then(() => keys);
		  });
		}
	  };
  }

const CACHE_STATIC_NAME = 'static-cache-v4';
const CACHE_DYNAMIC_NAME = 'dynamic-v5';


self.addEventListener('install', function(e) {
	console.log('[ServiceWorker] Installed');

	e.waitUntil(
		caches.open(CACHE_STATIC_NAME).then(function(cache) {
			console.log("[ServiceWorker] Precaching App Shell");
			return cache.addAll([
				'./',
				'./index.html',
				'./js/script.js',
				'./css/style.css',
				'./js/idb.js',
				'./js/index.js',
				'./js/promise.js',
				'./js/fetch.js',
				'//fonts.googleapis.com/css?family=Roboto:400,700'
			]);
		})
	)
})


self.addEventListener('activate', function (e) {
	console.log("[ServiceWorker] Activated", e);

	e.waitUntil(
	
		caches.keys().then(function (keyList) {
			return Promise.all(keyList.map(function (key) {

				if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
					console.log("[ServiceWorker] Removing old cache. ", key);
					return caches.delete(key);
				}
			}));
		})
	);
	e.waitUntil(
		createDB()
	  );
	return self.clients.claim();
});

// function isInArray(string, array) {
// 	for (let i = 0; i < array.length; i++) {
// 		if (array[i] === string) {
// 			return true;
// 		}
// 	}
// 	return false;
// }

self.addEventListener('fetch', function (e) {
	// console.log("[ServiceWorker] Fetching", e.request.url);
	console.log("url: ", e.request.url);
	const url = 'https://free.currencyconverterapi.com/api/v5/';
	if (e.request.url.indexOf(url) > -1) {
		console.log("in freecurrency block", e.request.url);
		e.respondWith(fetch(e.request)
			.then(function (res) {
				const clonedRes = res.clone();	
				clonedRes.json().then(function (obj) {
					console.log(e.request.url, obj);		
					idbcurrencies.set(e.request.url, obj);										
				});	
				return res;
			}).catch(function(err){	
				console.log('offline called');
				return idbcurrencies.get(e.request.url)
				.then(function(obj){
					console.log(obj);
					return 	new Response(obj, {
						ok: true,
						status: 200,
						url: e.request.url
					});	
				});
							
							
			})
		);
	// }
	// else if (isInArray(et.request.url, CACHE_STATIC_NAME)) {
	// 	e.respondWith(
	// 		caches.match(e.request)
	// 	);
	} else {
		console.log("in cache block", e.request.url);
		e.respondWith(
			caches.match(e.request).then(function (response) {
				if (response) {
					return response;
				} else {
					return fetch(e.request)
						.then(function (res) {
							const clone = res.clone();
							caches.open(CACHE_DYNAMIC_NAME)
								.then(function (cache) {
									cache.put(e.request.url, clone);									
								});
							return res;
						}).catch(function(err){
							return new Response('.....', {
								ok: false,
								status: 404,
								url: '/'
							});
						});
				}
			})
		);

	}
});