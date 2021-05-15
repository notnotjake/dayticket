// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// * * Overview  * * * * * * * * * * * * * * * * * * * * * * 
// APP - handles the flow of the page
// VIEW - handles changes that the user sees
// DATA - handles anything related to airtable, cookies, and data
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// * * Set Variables * * * * * * * * * * * * * * * * * * * *
const airtableURL = 'https://api.airtable.com/v0/app9sUZzisuGNjntz/' //the URL of the airtable project
const airtableTables = ['Materials', 'Labor'] //airtableTables - array of the table's names you want to load
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -




// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ## APP
// Responsible for main controlling of the page
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const APP = {
	init: function (url, tables) {
		// Set some things up initially
		DATA.airtableURL = url
		DATA.airtableTables = tables
		
		VIEW.removeJSDisabledMessage()
		
		// Draw Toolbar
		VIEW.setToolbar()
		// Start by getting the data from AirTable
		APP.getData()
		
	},
	getData: function () {
		if ( DATA.isKeyValid() ) {
			DATA.loadJSON(DATA.airtableTables[0])
			VIEW.setToolbar()
		} else {
			VIEW.setToolbar()
		}
	}
}




// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ## VIEW
// Responsible for changing things on screen
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VIEW = {
	setDatePicker: function () {
		var dateField = document.querySelector('#date')
		var date = new Date()
		dateField.value = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0) + '-' + date.getDate().toString().padStart(2, 0)
	},
	removeJSDisabledMessage: function () {
		document.querySelector('#js-enabled').style.display = 'none'
	},
	setToolbar: function () {
		if (DATA.connectionStatus == 'connected') {
			document.querySelector('#toolbar').innerHTML = `
			<form class="form-wrapper toolbar-actions">
				<input type="date" id="date" name="ticket-date" value="2021-01-01" min="2021-01-01" max="2050-12-31">
				<input type="text" id="builder-name" name="builder-name" placeholder="Builder">
				<input  type="text" id="lot-block" name="lot-block" placeholder="Lot & Block">
			</form>
			
			<div id="toolbar-functions" class="toolbar-actions">
				<div id="connection-status" class="toolbar-actions">
					<div id="connection-status-button">
						<p id="connection-status-description" class="on-auth-hide">Valid Key: a87b472b</p>
						<button id="connection-status-icon" title="You're connected" class="on-auth-hide"><i class="bi bi-cloud-check-fill""></i></button>
					</div>
				</div>
			
				<div id="actions-group" class="actions-wrapper toolbar-actions">
					<div id="merged-left">
						<button id="printButton"><i class="bi bi-printer-fill"></i>&nbsp Print</button>
					</div>
					<div id="merged-right">
						<button id="exportButton"><i class="bi bi-file-earmark-spreadsheet-fill"></i>&nbsp Export</button>
					</div>
					<div>
						<button id="clearButton">Clear</button>
					</div>
				</div>
			</div>
			`		
			document.querySelector('#toolbar').style.justifyContent = 'space-between'
			document.querySelector('#toolbar').style.backgroundColor = '#f8f3dd'
			document.querySelector('#toolbar').style.borderBottom = '1px solid #dad9cf'
			document.querySelector('#toolbar').style.borderTop = '1px solid #dad9cf'
			
			VIEW.setDatePicker()

			document.querySelector('#connection-status').addEventListener('mouseover', () => {
				document.querySelector('#connection-status-description').style.display = 'flex'
				console.log('hover event')
			})
			document.querySelector('#connection-status').addEventListener('mouseout', () => {
				document.querySelector('#connection-status-description').style.display = 'none'
			})
		} else {
			document.querySelector('#toolbar').innerHTML = `
			<form class="auth">
				<label for="auth-key">&nbsp Key</label>
				<input class="input" type="text" id="api-key" name="api-key" placeholder="Enter Security Key to Connect"/>
				<div id="auth-button">
					<button>Enroll</button>
				</div>
			</form>
			`
			document.querySelector('.error-hint').style.display = 'flex';
			document.querySelector('#api-key').focus()
			
			document.querySelector('#auth-button').addEventListener('click', () => {
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
	
	airtableURL: '',
	airtableTables: [],
	
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
		const reqURL = `${DATA.airtableURL}${encodeURI(table)}`
		console.log("Trying at URL " + reqURL)
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
					DATA.connectionStatus = "badkey"
					VIEW.showAuth()
					throw Error("Authentication Error")
				} else if (response.status == 404) {
					throw Error("Data record can't be found")
				} else if (!response.ok) {
					throw Error("Something went wrong" + response.status + " - " + response.statusText)
				}
				DATA.isConnected = true
				VIEW.updateStatusIcon("connected")
				console.log("Data retrieved successfully")
				return response.json()
			})
			.then(resData => {
				DATA.dataObj = resData.records
				console.log(DATA.dataObj)
				VIEW.table(resData.records)
			})
			.catch(err => {
				console.log(err)
			})
	}
}




APP.init(airtableURL, airtableTables)



// class ITEM {
// 	constructor(name, cost, unit) {
// 		this.name = name
// 		this.cost = cost
// 		this.unit = unit
// 	}
// }
// 
// let newItem = new ITEM("a name", 0.85, "whole")
// console.log(newItem)