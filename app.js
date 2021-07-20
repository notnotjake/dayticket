const APP = {
	init: function () {
		DRAW.removeJSMessage()
		DRAW.setDatePicker()
		
		if ( DATA.keyValidation('apiKey').isValid ) {
			APP.getDataTest()
		} else {
			DRAW.auth('')
		}
	},
	getDataTest: function () {
		DRAW.auth('<i class="bi bi-exclamation-circle-fill"></i>Key Was Rejected')
		//renderSections()
	},
	getData: function (dataObj) {
		const reqURL = 'https://api.airtable.com/v0/app9sUZzisuGNjntz/' + encodeURI(dataObj.at)
		console.log("Trying to get " + dataObj.name + " at URL " + reqURL)
		const reqPromise = fetch(reqURL, {
			method: "GET",
			withCredentials: true,
			headers: {
				"Authorization": `Bearer ${DATA.key('apiKey')}`
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
	}
}

const DRAW = {
	elementFactory: function (elem, attr) {
		let objectNode = document.createElement(elem)
		attr.forEach( (x) => {
			objectNode.setAttribute(x.name, x.value)
		})
		return objectNode
	},
	removeJSMessage: function () {
		document.querySelector('.js-message').remove()
	},
	setDatePicker: function () {
		var dateField = document.querySelector('#date')
		var date = new Date()
		dateField.value = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0) + '-' + date.getDate().toString().padStart(2, 0)
	},
	auth: function (condition) {
		let authForm = DRAW.elementFactory('div',[{name:'class',value:'auth-container'}])
		
		authForm.innerHTML = '<h2>Authenticate</h2><p>You\'re device will be remembered for 30 days</p>'
		let form = DRAW.elementFactory('div',[{name:'class',value:'new-auth'}])
		let input = DRAW.elementFactory('input',[
			{name:'type',value:'text'},
			{name:'id',value:'new-auth-key'},
			{name:'placeholder',value:'Security Key'},
			{name:'autofocus',value:'true'},
			{name:'required',value:'true'}
			])
		let button = DRAW.elementFactory('button',[
			{name:'id',value:'new-auth-enroll'},
			{name:'disabled',value:'true'},
			])
			button.innerHTML = '<i class="bi bi-arrow-right-circle-fill"></i>'
		
		form.appendChild(input)
		form.appendChild(button)
		authForm.appendChild(form)
		
		let authHelp = document.createElement('p')
			authHelp.id = 'auth-help'
			authHelp.innerHTML = condition
		authForm.appendChild(authHelp)
					
		document.querySelector('.app-controls').insertAdjacentElement('afterbegin', authForm)
		
		//activate button when input is not blank
		input.addEventListener('input', () => {
			if ( input.value != '' ) { button.disabled = false }
			else { button.disabled = true }
		})
		
		//give the button a job
		button.addEventListener('click', () => {
			console.log('button was clicked')
			if ( input.value.length < 10 ) {
				authHelp.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i>Invalid Key'
			} else {
				//really, should only do this after connected so we dont save a bad one
				DATA.bakeCookies('apiKey', input.value, 30)
				APP.getDataTest()
			}
		})
	}
}

const DATA = {
	materials: {
		name: 'Materials',
		at: 'Materials?view=Sorted'
	},
	freshCookies: function () {
		return document.cookie
	},
	bakeCookies: function (key, value, days) {
		var date = new Date()
		date.setTime(date.getTime() + (days*24*60*60*1000) )
		var expires = 'expires='+date.toUTCString()
		document.cookie = key + '=' + value + ';' + expires + ';'
		
		console.log(key + " was set to: " + value)
	},
	key: function (key) {
		let end = DATA.freshCookies().length
		let i = DATA.freshCookies().indexOf(';', DATA.freshCookies().indexOf(key + '='))
		if ( i >= 0 ) { end = i }
		
		return DATA.freshCookies().slice(DATA.freshCookies().indexOf(key + '=') + key.length + 1, end)
	},
	keyValidation: function (key) {
		if ( typeof DATA.freshCookies() == 'undefined' || DATA.freshCookies == '' || !DATA.freshCookies().includes(key) ) {
			console.log('API Key Doesn\'t Exist - There Are No Cookies')
			return {
				isValid: false,
				helpHTML: '<i class="bi bi-exclamation-circle-fill"></i>Key is Required',
			}
		} 
		else if ( DATA.key(key) == '' || DATA.key(key) == 'null') {
			console.log('API Key is Empty')
			return {
				isValid: false,
				helpHTML: '<i class="bi bi-exclamation-circle-fill"></i>Key is Required',
			}
		}
		else if ( DATA.key(key).length < 10 ) {
			console.log('API Key is Too Short')
			return {
				isValid: false,
				helpHTML: '<i class="bi bi-exclamation-circle-fill"></i>Invalid Key',
			}
		} else {
			console.log('API Key (' + DATA.key(key) + ') Appears Valid. Will Try to Connect...')
			return {
				isValid: true,
				helpHTML: ''
			}
		}
	}
}





// billing input
let input = document.querySelector('#billing')

let timeout = null
input.addEventListener('keyup', () => {
	clearTimeout(timeout)
	timeout = setTimeout(function () {
		//do something after delay typing
	}, 900)
})

function mathInline (n) {
	if (n.includes('*')) {
		index = n.search('\\*')
		term1 = parseFloat(n.substring(0, index) )
		term2 = parseFloat(n.substring(index+1) )
		n = term1 * term2
	} else if (n.includes('/')) {
		index = n.search('/')
		dividend = parseFloat(n.substring(0, index) )
		divisor = parseFloat(n.substring(index+1) )
		n = dividend / divisor
	} else if (n.includes('-')) {
		index = n.search('-')
		term1 = parseFloat(n.substring(0, index) )
		term2 = parseFloat(n.substring(index+1) )
		n = term1 - term2
	} else if (n.includes('+')) {
		index = n.search('\\+')
		term1 = parseFloat(n.substring(0, index) )
		term2 = parseFloat(n.substring(index+1) )
		n = term1 + term2
	}
	return n
}

function currency (n) {
	while (n.includes(',')) {
		index = n.search(',')
		n = n.substring(0, index) + n.substring(index+1)
	}
	n = mathInline(n)
	n = parseFloat(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
	return n
}

input.addEventListener('blur', () => {
	if (input.value != '') {
		input.value = currency(input.value)
	}
})


// sections
let shownIcon = '<i class="bi bi-caret-down-fill"></i>'
let hiddenIcon = '<i class="bi bi-caret-right-fill"></i>'

function addSection (column, name, data, headerClass) {
	
	let section = document.createElement('div')
		section.classList.add('section-table')
	
	let sectionList = document.createElement('ul')
	data.forEach( (x) => {
		let item = document.createElement('label')
		item.innerHTML = `
			<li>
				<div class="input-wrapper"><input type="numeric" min="0" class="qty"/></div>
				<p>${x}</p>
			</li>`
		sectionList.appendChild(item)
	})
	
	let sectionHeader = document.createElement('h1')
		sectionHeader.innerText = name
		sectionHeader.classList.add(headerClass)
	
	let expandButton = document.createElement('button')
		sectionList.style.display = 'block'
		expandButton.innerHTML = shownIcon
		expandButton.addEventListener('click', () => {
			if (sectionList.style.display == 'block') {
				sectionList.style.display = 'none'
				expandButton.innerHTML = hiddenIcon
			} else {
				sectionList.style.display = 'block'
				expandButton.innerHTML = shownIcon
			}
		})
	
	sectionHeader.insertAdjacentElement('afterbegin', expandButton)
	
	section.appendChild(sectionHeader)
	section.appendChild(sectionList)
	
	document.querySelector('#column-' + column).insertAdjacentElement('beforeend', section)
}

function renderSections () {
	addSection(1, 'Prewire & Cable', ['1G LV NAIL ON', '1 1/2" INNER DUCT (ORG)', '1G LV RING (LV-1)'])
	addSection(1, 'Cable Ends & Jacks', ['1G LV NAIL ON', '1 1/2" INNER DUCT (ORG)', '1G LV RING (LV-1)'])
	addSection(2, 'Faceplate & Trimout', ['FP 1G 1P KEYSTONE', 'COAX 1X () SPLITTER'])
	addSection(2, 'Sound, AV, & Automation', ['C641 SPEAKERS (PAIR)', 'C651 CENTER (EACH)'])
	addSection(3, 'Alarm/Security', ['GC3 PANEL', 'DW CONTACT', 'PIR MOTION', 'GLASS BREAK'])
	addSection(3, 'Central Vac', ['3 INLET ROUGHIN KIT (NO PIPE)', 'TUBING END CAP'])
	addSection(4, 'Labor', ['Carlos', 'Brandon'], 'labor')
}





APP.init()