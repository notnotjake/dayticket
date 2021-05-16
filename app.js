// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// * * Overview  * * * * * * * * * * * * * * * * * * * * * * 
// APP - handles the flow of the page
// DRAW - handles changes that the user sees
// DATA - handles anything related to airtable, cookies, and data
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// * * Set Variables * * * * * * * * * * * * * * * * * * * *
const airtableURL = 'https://api.airtable.com/v0/app9sUZzisuGNjntz/' //the URL of the airtable project
const materialsAT = 'Materials'
const materialsSections = [ ['Prewire & Cable', 1], ['Cable Ends & Jacks', 1], ['Faceplate & Trimout', 2], ['Sound, AV, & Automation', 2], ['Alarm/Security', 2], ['Central Vac', 2] ]
const laborAT = 'Labor'
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// ## Define an 'Item' for Materials data object
class ITEM {
	constructor(name, cost, unit, id, section, qty) {
		this.name = name
		this.cost = cost
		this.unit = unit
		this.id = id
		this.section = section
		this.qty = qty
	}
}
// ## Define a 'Laborer' for Labor data object
class RATE {
	constructor(name, regWage, otWage, id, hours) {
		this.name = name
		this.regWage = regWage
		this.otWage = otWage
		this.id = id
		this.hours = hours
	}
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ## APP
// Responsible for main controlling of the page
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const APP = {
	init: function (url) {
		DRAW.removeJSDisabledMessage()
		APP.goGetData()
	},
	goGetData: function () {
		if ( DATA.isKeyValid() ) {
			APP.getData(DATA.materials)
			APP.getData(DATA.labor)
		} else {
			DRAW.updateToolbar()
		}
	},
	
	// tries to get data for data object passed to it
	// on success, updates toolbar and then proceeds to APP.useData
	// on fail, updates the toolbar
	getData: function (dataObj) {
		const reqURL = `${airtableURL}${encodeURI(dataObj.AT)}`
		console.log("Trying to get " + dataObj.name + " at URL " + reqURL)
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
					DATA.connectionStatus = 'Invalid Key'
					throw Error("Authentication Error")
				} else if (response.status == 404) {
					DATA.connectionStatus = 'Connection to Server Failed'
					throw Error("Record Not Found")
				} else if (!response.ok) {
					DATA.connectionStatus = 'Something Went Wrong'
					throw Error("Something Went Wrong - " + response.status + ": " + response.statusText)
				} else {
					DATA.connectionStatus = 'connected'
					DRAW.updateToolbar()
					return response.json()
				}
			})
			.then(responseData => {
				dataObj.data = responseData.records
				APP.useData(responseData.records, dataObj)
			})
			.catch(err => {
				DRAW.updateToolbar()
				console.log(err)
			})
	},
	useData: function (data, dataObj) {
		console.log(dataObj.name + " Data Retrieved Successfully:")
		dataObj.parseData()
		console.log(dataObj.data)
		DRAW.table(dataObj)
	}
}




// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ## DRAW
// Responsible for changing things on screen
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DRAW = {
	table: function(dataObj) {
		if (dataObj.name == 'materials') {
			let htmlColumn1Render = ''
			let htmlColumn2Render = ''
			DATA.materials.sections.forEach( (i) => {
				let htmlSectionRender = ``
				htmlSectionRender += `<h2>${i[0]}</h2>`
				
				DATA.materials.data.forEach( (x) => {
					if (x.section == i[0]) {
						htmlSectionRender += `<p>${x.name} ${x.cost}</p>`
					}
				})
				
				htmlColumn1Render += htmlSectionRender
			})
			document.querySelector(`#column-1`).innerHTML = htmlColumn1Render

		} else if (dataObj.name == 'labor') {
			htmlRender = ''
			DATA.labor.data.forEach( (i) => {
				htmlRender += `
					<p>${i.name} ${i.regWage}</p>
				`
			})
			document.querySelector('#column-3').innerHTML = htmlRender
		}
	},
	
	setDatePicker: function () {
		var dateField = document.querySelector('#date')
		var date = new Date()
		dateField.value = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0) + '-' + date.getDate().toString().padStart(2, 0)
	},
	removeJSDisabledMessage: function () {
		document.querySelector('#js-enabled').style.display = 'none'
	},
	updateToolbar: function () {
		if (DATA.connectionStatus == 'connected') {
			DRAW.setToolbarActive()
		} else {
			DRAW.setToolbarAuth()
		}
	},
	
	authFirstTry: true,
	setToolbarAuth: function () {
		if (DRAW.authFirstTry) {
			document.querySelector('.error-hint').style.display = 'none'
			DRAW.authFirstTry = false
		} else {
			document.querySelector('.error-hint').style.display = 'flex';
			document.querySelector('#error-hint-text').innerHTML = DATA.connectionStatus;
			
		}
		document.querySelector('#toolbar').innerHTML = `
		<form class="auth">
			<label for="auth-key">&nbsp Key</label>
			<input class="input" type="text" id="api-key" name="api-key" placeholder="Enter Security Key to Connect"/>
			<div id="auth-button">
				<button>Enroll</button>
			</div>
		</form>
		`
		document.querySelector('#api-key').value = DATA.key
		document.querySelector('#api-key').focus()
		
		document.querySelector('#auth-button').addEventListener('click', () => {
			DATA.bakeCookies(document.querySelector('#api-key').value)
			APP.goGetData()
		})
	},
	setToolbarActive: function () {
		document.querySelector('#toolbar').innerHTML = `
		<form class="form-wrapper toolbar-actions">
			<input type="date" id="date" name="ticket-date" value="2021-01-01" min="2021-01-01" max="2050-12-31">
			<input type="text" id="builder-name" name="builder-name" placeholder="Builder">
			<input  type="text" id="lot-block" name="lot-block" placeholder="Lot & Block">
		</form>
		
		<div id="toolbar-functions" class="toolbar-actions">
			<div id="connection-status" class="status-wrapper toolbar-actions">
				<div id="connection-status-button">
					<p id="connection-status-description" class="on-auth-hide">Valid Key:&nbsp<span id="shown-key">${DATA.key}</span></p>
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
		document.querySelector('.error-hint').style.display = 'none'
		
		DRAW.setDatePicker()
		
		document.querySelector('#connection-status').addEventListener('mouseover', () => {
			document.querySelector('#connection-status-description').style.display = 'flex'
			console.log('hover event')
		})
		document.querySelector('#connection-status').addEventListener('mouseout', () => {
			document.querySelector('#connection-status-description').style.display = 'none'
		})
	}
}




// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ## DATA
// Responsible for taking care of the data and connecting with AirTable
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DATA = {
	materials: {
		name: 'materials',
		AT: materialsAT,
		data: [],
		sections: materialsSections,
		parseData: function () {
			let dataReturned = []
			DATA.materials.data.forEach((i) => {
				// ITEM arguments: name, cost, unit, id, section, qty
				let iRecord = new ITEM(i.fields.name, i.fields.cost, i.fields.unit, i.id, i.fields.section, null)
				dataReturned.push(iRecord)
			})
			DATA.materials.data = dataReturned
			
			return DATA.materials.data
		},
		// not used, opting to manually enter
		getSections: function () {
			DATA.materials.data.forEach( (i) => {
				DATA.materials.sections.push(i.section)
			})			
			
			let unique = []
			unique = DATA.materials.sections.filter((value, index, self) => {
				return self.indexOf(value) === index
			})
			DATA.materials.sections = unique
		}
	},
	labor: {
		name: 'labor',
		AT: laborAT,
		data: [],
		parseData: function () {
			let dataReturned = []
			DATA.labor.data.forEach((i) => {
				// RATE arguments: name, regWage, otWage, id, hours
				let iRecord = new RATE(i.fields.name, i.fields.regular, i.fields.overtime)
				dataReturned.push(iRecord)
			})
			DATA.labor.data = dataReturned
			
			return DATA.labor.data
		}
	},
	
	connectionStatus: "",
	keyName: "apiKey",
	key: '',
	
	cookies: document.cookie,	
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
		if (typeof DATA.cookies == 'undefined' || DATA.cookies == "" || !DATA.cookies.includes(DATA.keyName)) {
			DATA.connectionStatus = 'Key is Required'
			console.log("API Key Doesn't Exist - There Are No Cookies")
			return false
		}
		
		DATA.loadKey()
		
		if (DATA.key == "" || DATA.key == "null") {
			DATA.connectionStatus = 'Key is Required'
			console.log("API Key is Empty")
			return false
		}
		if (DATA.key.length < 10) {
			DATA.connectionStatus = 'Invalid Key'
			console.log("API Key is Too Short")
			return false
		}
		else {
			console.log("API Key '" + DATA.key + "' appears valid. Will try to connect...")
			return true
		}
	}
}




APP.init()