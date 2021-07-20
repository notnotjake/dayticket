const APP = {
	init: function () {
		DRAW.removeJSMessage()
		DRAW.setDatePicker()
		
		if ( DATA.key.isValid() ) {
			APP.getData()
		} else {
			DRAW.auth()
		}
	},
	getData: function () {
		let helpText = ''
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
					helpText = 'Key Rejected'
					throw Error("Authentication Error")
				} else if (response.status == 404) {
					helpText = 'Couldn\'t Connect to Server'
					throw Error("Record Not Found")
				} else if (!response.ok) {
					helpText = 'Something Went Wrong'
					throw Error("Something Went Wrong - " + response.status + ": " + response.statusText)
				} else {
					return response.json()
				}
			})
			.then(responseData => {
				DATA.key.renew(30)
				dataObj.data = responseData.records
				APP.useData(responseData.records, dataObj)
			})
			.catch(err => {
				DRAW.auth()
				DRAW.auth(helpText)
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
	toolbarEnabled: function (state) {
		if (state) {
			console.log('should be enabled now')
		} else {
			console.log('should be disabled')
		}
	},
	auth: function (condition) {
		if (typeof condition == 'undefined') {
			let authForm = DRAW.elementFactory('div',[{name:'class',value:'auth-container'}])
			
			authForm.innerHTML = '<h2>Authenticate</h2><p>You\'re device will be remembered for 30 days</p>'
			let form = DRAW.elementFactory('div',[{name:'class',value:'new-auth'}])
			let input = DRAW.elementFactory('input',[
				{name:'type',value:'text'},
				{name:'id',value:'new-auth-key'},
				{name:'placeholder',value:'Security Key'},
				{name:'autofocus',value:'true'},
				{name:'required',value:'true'},
				{name:'onclick',value:'select()'}
				])
			input.value = DATA.key.value()
			let button = DRAW.elementFactory('button',[
				{name:'id',value:'new-auth-enroll'},
				{name:'disabled',value:'true'},
				])
				button.innerHTML = '<i class="bi bi-arrow-right-circle-fill"></i>'
			//activate button when input is not empty
			input.addEventListener('input', () => {
				document.querySelector('#auth-help').innerHTML = ''
				if ( input.value != '' ) {
					button.disabled = false
				}
				else {
					button.disabled = true
				}
			})
			//button enrolls key
			button.addEventListener('click', () => {
				DATA.bakeCookies(DATA.key.name, input.value, 30)
				if ( DATA.key.isValid() ) {
					document.querySelector('.auth-container').remove()
					APP.getData()
				}
				else {
					DRAW.auth('Key Invalid')
				}
			})
			
			form.appendChild(input)
			form.appendChild(button)
			authForm.appendChild(form)
			authForm.appendChild(DRAW.elementFactory('p',[{name:'id',value:'auth-help'}]))
						
			document.querySelector('.app-controls').insertAdjacentElement('afterbegin', authForm)
		}
		else {
			document.querySelector('#new-auth-key').value = DATA.key.value()
			document.querySelector('#auth-help').innerHTML = '<i class="bi bi-exclamation-circle-fill"></i>' + condition
		}
		document.querySelector('#new-auth-key').select()
	}
}

const DATA = {
	materials: {
		name: 'Materials',
		at: 'Materials?view=Sorted',
		data: []
	},
	labor: {
		name: 'Labor',
		at: 'Labor',
		data: []
	},
	freshCookies: function () {
		return document.cookie
	},
	bakeCookies: function (key, value, days) {
		var date = new Date()
		date.setTime(date.getTime() + (days*24*60*60*1000) )
		var expires = 'expires='+date.toUTCString()
		document.cookie = key + '=' + value + ';' + expires + ';'
		
		console.log('API Key Set (' + value + ')')
	},
	key: {
		name: 'apiKey',
		value: function () {
			let end = DATA.freshCookies().length
			let i = DATA.freshCookies().indexOf(';', DATA.freshCookies().indexOf(DATA.key.name + '='))
			if ( i >= 0 ) { end = i }
			
			return DATA.freshCookies().slice(DATA.freshCookies().indexOf(DATA.key.name + '=') + DATA.key.name.length + 1, end)
		},
		isValid: function () {
			if ( typeof DATA.freshCookies() == 'undefined' || DATA.freshCookies == '' || !DATA.freshCookies().includes(DATA.key.name) || DATA.key.value() == '') {
				console.log('API Key Doesn\'t Exist')
				return false
			} else if (DATA.key.value().length < 10 ) {
				console.log('API Key is Too Short')
				return false
			} else {
				return true
			}
		},
		renew: function (days) {
			let keyValue = DATA.key.value()
			DATA.bakeCookies(DATA.key.name, keyValue, days)
			console.log('API Key Cookie Extended for 30 Days')
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