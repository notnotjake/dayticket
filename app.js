// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ## APP
// Responsible for main controlling of the page
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const APP = {
	init: function () {
		DRAW.setDatePicker()
		DRAW.setStatusIcon()
		DRAW.removeJSDisabledMessage()
		APP.addListeners()
		
		APP.getData()
		
	},
	getData: function () {
		if ( DATA.isKeyValid() ) {
			DRAW.hideAuth()
			DATA.loadJSON("Materials")
		} else {
			DRAW.showAuth()
		}
	},
	addListeners: function () {
		document.querySelector('#status-icon').addEventListener('click', () => {
			if (document.querySelector('#api-validation').style.display == "none") { DRAW.showAuth() }
			else { DRAW.hideAuth() }
		})
	}
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ## DRAW
// Responsible for changing things on screen
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DRAW = {
	setDatePicker: function () {
		var dateField = document.querySelector('#date')
		var date = new Date()
		dateField.value = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0) + '-' + date.getDate().toString().padStart(2, 0)
	},
	removeJSDisabledMessage: function () {
		document.querySelector('#js-enabled').innerHTML = ""
	},
	setStatusIcon: function (status) {
		let statusSet = '<i class="bi bi-moon-stars-fill" style="color:#786BB4;"></i>'
		if (status == "nokey") {
			statusSet = '<i class="bi bi-shield-lock-fill" style="color: #FFBE31;"></i>'
		} else if (status == "badkey") {
			statusSet = '<i class="bi bi-exclamation-diamond-fill" style="color:#eaa017;"></i>'
		} else if (status == "connected") {
			statusSet = '<i class="bi bi-cloud-check-fill" style="color:#19b851;"></i>'
		}
		document.querySelector('#status-icon').innerHTML = statusSet
	},
	hideAuth: function () {
		document.querySelector('#api-validation').style.display = "none"
	},
	showAuth: function () {
		document.querySelector('#api-validation').style.display = "flex"
		
		if (DATA.isConnected) {
			document.querySelector('#api-key').value = DATA.key
			DRAW.setStatusIcon("connected")
		} else {
			DRAW.setStatusIcon("nokey")
			document.querySelector('#api-key').value = DATA.key
			document.querySelector('#api-key').focus()
			
			document.querySelector('#enroll-submit').addEventListener('click', () => {
				DATA.bakeCookies(document.querySelector('#api-key').value)
				APP.getData()
			})
		}
		
	},
	table: function(data) {
		document.querySelector('#js-enabled').innerHTML = data[1].fields.name
	}
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ## DATA
// Responsible for taking care of the data and connecting with AirTable
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DATA = {
	connectionStatus: "",
	keyName: "apiKey",
	key: '',
	dataObj: [],
	cookies: document.cookie,
	isConnected: false,
	freshCookies: function () {
		DATA.cookies = document.cookie
		return DATA.cookies
	},
	bakeCookies: function (value) {
		var d = new Date();
		d.setTime(d.getTime() + (45*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = DATA.keyName + "=" + value + ";" + expires;
		console.log(DATA.keyName + " was set to: " + value)
	},
	loadKey: function () {
		let end = DATA.cookies.length
		let i = DATA.cookies.indexOf(";", DATA.cookies.indexOf(DATA.keyName + "="))
		if ( i >= 0 ) { end = i }		
		
		DATA.key = DATA.cookies.slice(DATA.cookies.indexOf(DATA.keyName + "=") + DATA.keyName.length + 1, end)
	},
	isKeyValid: function () {
		DATA.freshCookies()
		if (typeof DATA.cookies == 'undefined' || DATA.cookies == "") {
			console.log("API Key Doesn't Exist - There Are No Cookies")
			return false
		}
		if (!DATA.cookies.includes(DATA.keyName)) {
			console.log("API Key Doesn't Exist")
			return false
		}
		
		DATA.loadKey()
		
		if (DATA.key == "" || DATA.key == "null") {
			console.log("API Key is Empty")
			return false
		}
		if (DATA.key.length < 10) {
			console.log("API Key is Too Short")
			return false
		}
		else {
			console.log("API Key '" + DATA.key + "' appears valid. Will try to connect...")
			return true
		}
	},
	loadJSON: function (table) {
		const reqURL = `https://api.airtable.com/v0/app9sUZzisuGNjntz/${encodeURI(table)}`
		const reqPromise = fetch(reqURL, {
			method: "GET",
			withCredentials: true,
			headers: {
				"Authorization": `Bearer ${DATA.key}`
			}
		})	
		reqPromise
			.then(response => {
				if (response.status == 401) {
					DRAW.showAuth()
					throw Error("Authentication Error")
				} else if (response.status == 404) {
					throw Error("Data record can't be found")
				} else if (!response.ok) {
					throw Error("Something went wrong" + response.status + " - " + response.statusText)
				}
				DATA.isConnected = true
				DRAW.setStatusIcon("connected")
				console.log("Data retrieved successfully")
				return response.json()
			})
			.then(resData => {
				DATA.dataObj = resData.records
				console.log(DATA.dataObj)
				DRAW.table(resData.records)
			})
			.catch(err => {
				console.log(err)
			})
	}
}

class ITEM {
	constructor(name, cost, unit) {
		this.name = name
		this.cost = cost
		this.unit = unit
	}
}

let newItem = new ITEM("a name", 0.85, "whole")
console.log(newItem)



APP.init()