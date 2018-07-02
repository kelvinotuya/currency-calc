if (!window.Promise) {
	window.Promise = Promise;
}

if ('serviceWorker' in navigator) {

	navigator.serviceWorker
		.register('/sw.js')
		.then(function (registration) {
			console.log("Service Worker is Registered");
		})
		.catch(function (err) {
			console.log("Service worker Failed to Register", err);
		}); 
}
 

//onload event handler
function ready(fn) {
		if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
			fn();
		} else {
			document.addEventListener('DOMContentLoaded', fn);
		}
	}

//fetch currencies in the handler
ready(() => {
		fetch('https://free.currencyconverterapi.com/api/v5/currencies')
			.then(response => {
				if (!response.ok) {
					throw Error(response.statusText);
				}
				return response.json();
			})
			.then(data => {
				if (data.results) {
					const currencies = data.results;
					let list = "<option value='' selected>--Please choose an option--</option>";
					Object.keys(currencies).forEach(key => {
						list += `<option value='${key}' >${currencies[key]['currencyName']} (${currencies[key]['id']})</option>`;
					});
					document.getElementById('currencyFrom').innerHTML = list;
					document.getElementById('currencyTo').innerHTML = list;
				} else {
					throw Error("No result found");
				}
			})
			.catch(err => {
				document.getElementById('currencyTo').innerHTML = '<option value="">Empty</option>';
				document.getElementById('currencyFrom').innerHTML = '<option value="">Empty</option>';
			});

//function to convert fetched currency
function moneyConvert() {
			const fro_sym = document.getElementById('currencyFrom').value;
			const to_sym = document.getElementById('currencyTo').value;
			const key = `${fro_sym}_${to_sym}`;
			const inv_key = `${to_sym}_${fro_sym}`;
			const keys = `${key},${inv_key}`;
			fetch(`https://free.currencyconverterapi.com/api/v5/convert?q=${keys}`)
				.then(response => {
					if (!response.ok) {
						throw Error(response.statusText);
					}
					return response.json();
				})
				.then(data => {
					if (data.results) {
						const obj = data.results[key];
						const rate = obj.val;
						const from = document.querySelector(".currencyFrom").value;
						const to = (from * rate).toFixed(2);
						document.querySelector(".currencyTo").value = to;
					} else {
						throw Error("No result found");
					}
				}).catch(err => {
					document.querySelector('.err').innerHTML = err;
				});
		}

		document.querySelector(".convertButton").addEventListener("click", moneyConvert);
	});