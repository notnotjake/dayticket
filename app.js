const APP = {
	init: function () {
		DRAW.removeJSMessage()
		DRAW.setDatePicker()
		
		if ( DATA.key.isValid() ) {
			APP.getData([DATA.materials,DATA.labor])
		} else {
			DRAW.auth()
		}
	},
	getData: function (dataObjList) {
		let helpText = ''
		let firstTime = true
				
		dataObjList.forEach( (dataObj) => {
			const reqURL = 'https://api.airtable.com/v0/app9sUZzisuGNjntz/' + encodeURI(dataObj.at)
			console.log("Trying to get " + dataObj.name + " at URL: " + reqURL)
			const reqPromise = fetch(reqURL, {
				method: "GET",
				withCredentials: true,
				headers: {
					"Authorization": `Bearer ${DATA.key.value()}`
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
					dataObj.parseData(responseData.records)
					console.log(dataObj.name + ' Data Retrieved Successfully:')
					APP.renderData(dataObj)
					
					if (firstTime) {
						DATA.key.renew(30)
						DRAW.connectedStatus()
						DRAW.setToolbarActive()
						//DRAW.addSingleUse()
						firstTime = false
					}
				})
				.catch(err => {
					if (firstTime) {
						DRAW.auth()
						DRAW.auth(helpText)
						firstTime = false
					}
					console.log(err)
				})
		})
	},
	renderData: function (dataObj) {
		if (dataObj.name == 'Materials') {
			dataObj.sections.forEach( x => {
				let sectionData = []
				dataObj.data.forEach( i => {
					if (i.section == x[0]) {
						sectionData.push(i)
					}
				})
				DRAW.addSection(x[1], x[0], sectionData)
			})
		}
		else if (dataObj.name == 'Labor') {
			DRAW.addSection(4,dataObj.name,dataObj.data,'labor')
		}
	},
	printButton: function () {
		document.title = 'Dayticket_' + DATA.form.builder() + '_Lot-' + DATA.form.lot() +'_' + DATA.form.dateString()
		DRAW.printingPress()
		window.print()
		document.title = 'Dayticket Entry'
	},
	exportButton: function () {
		download('test.txt', 'hello world')
		
		function download(filename, contents) {
			var element = document.createElement('a')
			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent('Hello World'))
			element.setAttribute('download', filename)
			
			element.style.display = 'none'
			document.body.appendChild(element)
			
			element.click()
			
			document.body.removeChild(element)
		}
		
	},
	clearButton: function () {
		document.querySelectorAll('input').forEach( (x) => {
			x.value = ''
		})
		DRAW.setDatePicker()
	},
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
	setToolbarActive: function () {
		document.querySelector('#date').disabled = false
		document.querySelector('#builder').disabled = false
		document.querySelector('#lot').disabled = false
		document.querySelector('#billing').disabled = false
		document.querySelector('.input p').style.color = '#000000'
		document.querySelector('#print').disabled = false
		document.querySelector('#export').disabled = false
		document.querySelector('#clear').disabled = false
	},
	connectedStatus: function () {
		let connected = DRAW.elementFactory('div',[{name:'class',value:'app-status'}])
		connected.innerHTML = '<h2><i class="bi bi-cloud-check-fill"></i> Connected • <a href="https://airtable.com/tblGUdN0uXXlqKKlJ/">Edit AirTable Data</a>'
		document.querySelector('.app-controls').insertAdjacentElement('afterbegin', connected)
	},
	setDatePicker: function () {
		var dateField = document.querySelector('#date')
		var date = new Date()
		dateField.value = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0) + '-' + date.getDate().toString().padStart(2, 0)
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
					APP.getData([DATA.materials,DATA.labor])
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
	},
	addSingleUse: function () {
		let section = DRAW.elementFactory('div',[{name:'class',value:'section-table'}])
		
		let sectionHeader = document.createElement('h1')
		sectionHeader.innerText = 'Single Use Items'
		sectionHeader.classList.add(headerClass)
		
		section.appendChild(sectionHeader)
		
		document.querySelector('#column-4').insertAdjacentElement('beforeend', section)
	},
	addSection: function (column, name, data, headerClass) {
		let section = DRAW.elementFactory('div',[{name:'class',value:'section-table'}])
		
		let sectionList = document.createElement('ul')
		sectionList.classList.add('section-list')
		data.forEach( x => {
			let placeholderText = ''
			if (x.unit == 'whole') {
				placeholderText = ''
			} else {
				placeholderText = x.unit
			}
			
			let item = document.createElement('label')
			let itemLi = document.createElement('li')
			let inputWrapper = document.createElement('div')
			let itemInput = DRAW.elementFactory('input',[
				{name:'type',value:'number'},
				{name:'step',value:'0.01'},
				{name:'min',value:'0'},
				{name:'class',value:'qty'},
				{name:'id',value:'qty-'+(x.name)},
				{name:'onclick',value:'select()'},
				{name:'inputmode',value:'decimal'},
				{name:'placeholder',value:placeholderText}])
			let itemP = document.createElement('p')
			itemP.innerText = x.name
			
			inputWrapper.appendChild(itemInput)
			itemLi.appendChild(inputWrapper)
			itemLi.appendChild(itemP)
			item.appendChild(itemLi)
			
			itemInput.addEventListener('blur', () => {
				x.qty = DATA.formatInput(x.unit, itemInput)
			})
			
			sectionList.appendChild(item)
		})
		sectionList.style.display = 'block'
		
		let sectionHeader = document.createElement('h1')
			sectionHeader.innerText = name
			sectionHeader.classList.add(headerClass)
		
		let expandButton = document.createElement('button')
			expandButton.classList.add('expand-button')
			expandButton.innerHTML = shownIcon
			
			expandButton.addEventListener('click', () => {
				if (sectionList.style.display == 'block') {
					DRAW.hideSection(sectionList, expandButton)
				} else {
					DRAW.showSection(sectionList, expandButton)
				}
			})
		
		sectionHeader.insertAdjacentElement('afterbegin', expandButton)
		
		section.appendChild(sectionHeader)
		section.appendChild(sectionList)
		
		document.querySelector('#column-' + column).insertAdjacentElement('beforeend', section)
	},
	showhideSection: function (section, button) {
		if (section.style.display == 'block') {
			section.style.display = 'none'
			button.innerHTML = hiddenIcon
		} else {
			section.style.display = 'block'
			button.innerHTML = shownIcon
		}
	},
	showSection: function (section, button) {
		section.style.display = 'block'
		button.innerHTML = shownIcon
	},
	hideSection: function (section, button) {
		section.style.display = 'none'
		button.innerHTML = hiddenIcon
	},
	printingPress: function () {
		//header information
		document.querySelector('#print-builder').innerText = DATA.form.builder()
		document.querySelector('#print-lot').innerText = DATA.form.lot()
		document.querySelector('#print-date').innerText = DATA.form.dateString()
		//summary section
		document.querySelector('#print-billed').innerText = '$' + DATA.form.billing()
		document.querySelector('#print-labor-total').innerText = '$' + DATA.labor.total()
		document.querySelector('#print-materials-total').innerText = '$' + DATA.materials.total()
		document.querySelector('#print-total-cost').innerText = '$' + DATA.totalCost()
		document.querySelector('#print-gross-num').innerText = '$' + DATA.grossProfit().num
		document.querySelector('#print-gross-perc').innerText = DATA.grossProfit().perc + '%'
		
		DATA.materials.includes().forEach( x => {
			let item = DRAW.elementFactory('div',[{name:'class',value:'table-entry'}])
			
			let name = DRAW.elementFactory('p',[{name:'class',value:'column-1'}])
			let qty = DRAW.elementFactory('p',[{name:'class',value:'column-2'}])
			let cost = DRAW.elementFactory('p',[{name:'class',value:'column-3'}])
			
			name.innerText = x.name
			qty.innerText = x.qty
			cost.innerText = '$' + parseFloat(x.qty * x.cost).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
			
			item.appendChild(name)
			item.appendChild(qty)
			item.appendChild(cost)
			document.querySelector('#print-materials-table').appendChild(item)
		})
		DATA.labor.includes().forEach( x => {
			let item = DRAW.elementFactory('div',[{name:'class',value:'table-entry'}])
			
			let name = DRAW.elementFactory('p',[{name:'class',value:'column-1'}])
			let qty = DRAW.elementFactory('p',[{name:'class',value:'column-2'}])
			let cost = DRAW.elementFactory('p',[{name:'class',value:'column-3'}])
			
			name.innerText = x.name + ' ($' + x.regWage + '/hr)'
			qty.innerText = x.qty
			cost.innerText = '$' + parseFloat(x.qty * x.regWage).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
			
			item.appendChild(name)
			item.appendChild(qty)
			item.appendChild(cost)
			document.querySelector('#print-labor-table').appendChild(item)
		})
		
		//materials subtotal, tax
		let materialsSubtotal = 0
		DATA.materials.includes().forEach( x => {
			materialsSubtotal += (x.qty * x.cost)
		})
		let salesTax = materialsSubtotal * 0.06
		
		materialsSubtotal.toFixed(2)
		salesTax.toFixed(2)
		
		let materialsTaxLine = DRAW.elementFactory('div',[{name:'class',value:'table-entry total-line'}])
		let materialsTaxTitle = DRAW.elementFactory('p',[{name:'class',value:'column-1'}])
		materialsTaxTitle.innerText = 'Sales Tax'
		let materialsTaxNumber = DRAW.elementFactory('p',[{name:'class',value:'column-2'}])
		materialsTaxNumber.innerText = '$' + salesTax
		materialsTaxLine.appendChild(materialsTaxTitle)
		materialsTaxLine.appendChild(materialsTaxNumber)
		
		document.querySelector('#print-materials-table').appendChild(materialsTaxLine)
	},
	collapseAll: function () {
		console.log('hide...')
		document.querySelector('#showcollapseBtn').innerText = 'Expand All'
		document.querySelector('#showcollapseBtn').setAttribute('onClick','DRAW.expandAll()')
		
		document.querySelectorAll('.section-table').forEach( x => {
			DRAW.hideSection(x.querySelector('ul'),x.querySelector('button'))
		})
	},
	expandAll: function () {
		console.log('expand...')
		document.querySelector('#showcollapseBtn').innerText = 'Collapse All'
		document.querySelector('#showcollapseBtn').setAttribute('onClick','DRAW.collapseAll()')
		
		document.querySelectorAll('.section-table').forEach( x => {
			DRAW.showSection(x.querySelector('ul'),x.querySelector('button'))
		})
	}
}

class ITEM {
	constructor(name, cost, unit, id, section, qty) {
		this.name = name
		this.cost = cost
		this.unit = unit
		this.id = id
		this.section = section
		this.qty = ''
	}
}
class RATE {
	constructor(name, regWage, otWage, id, hours) {
		this.name = name
		this.regWage = regWage
		this.otWage = otWage
		this.id = id
		this.qty = ''
		this.unit = 'hrs'
	}
}
const DATA = {
	totalCost: function () {
		let totalCost = parseFloat(DATA.materials.total()) + parseFloat(DATA.labor.total())
		return totalCost.toFixed(2)
	},
	grossProfit: function () {
		let num = (DATA.form.billing() - DATA.totalCost()).toFixed(2)
		let perc = ((num / DATA.form.billing())*100).toFixed(1)
		
		return {num:num, perc:perc}
	},
	form: {
		date: function () {
			let date = new Date(document.querySelector('#date').value)
			return date
		},
		dateString: function () {
			let date = new Date(document.querySelector('#date').value)
			return (date.getMonth() + 1) + '/' + (date.getDate() + 1) + '/' + date.getFullYear()
		},
		builder: function () {
			return document.querySelector('#builder').value
		},
		lot: function () {
			return document.querySelector('#lot').value
		},
		billing: function () {
			return document.querySelector('#billing').value
		}
	},
	materials: {
		name: 'Materials',
		at: 'Materials?view=Sorted',
		data: [],
		parseData: function (data) {
			data.forEach( i => {
				DATA.materials.data.push(new ITEM(i.fields.name, i.fields.cost, i.fields.unit, i.id, i.fields.section, 0))
			})
		},
		sections: [['Prewire & Cable', 1],['Cable Ends & Jacks', 1],['Faceplate & Trimout', 2],['Sound, AV, & Automation', 2],['Alarm/Security', 3],['Central Vac', 3]],
		includes: function () {
			let includesData = []
			DATA.materials.data.forEach( x => {
				if (x.qty != '' && x.qty != 0 && x.qty != '0') {
					includesData.push(x)
				}
			})
			return includesData
		},
		total: function () {
			let total = 0
			DATA.materials.includes().forEach( x => {
				total += (x.qty * x.cost) * 1.06
			})
			return total.toFixed(2)
		}
	},
	labor: {
		name: 'Labor',
		at: 'Labor?view=Sorted',
		data: [],
		parseData: function (data) {
			data.forEach( i => {
				DATA.labor.data.push(new RATE(i.fields.name, i.fields.regular, i.fields.overtime))
			})
		},
		includes: function () {
			let includesData = []
			DATA.labor.data.forEach( x => {
				if (x.qty != '' && x.qty != 0 && x.qty != '0') {
					includesData.push(x)
				}
			})
			return includesData
		},
		total: function () {
			let total = 0
			DATA.labor.includes().forEach( x => {
				total += x.qty * x.regWage
			})
			return total.toFixed(2)
		}
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
	},
	formatInput: function (type, input) {
		let n = input.value
		
		if (type != 'whole' && n != '') {
			while (n.includes(',')) {
				index = n.search(',')
				n = n.substring(0, index) + n.substring(index+1)
			}
			n = DATA.mathInline(n)
			input.value = parseFloat(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
			n = parseFloat(n)
		}
		if (type == 'whole' && n != '') {
			n = DATA.mathInline(n.toString())
			n = parseInt(n)
			input.value = n
		}
		return n
	},
	mathInline: function (n) {
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
}


// sections
let shownIcon = '<i class="bi bi-caret-down-fill"></i>'
let hiddenIcon = '<i class="bi bi-caret-right-fill"></i>'

APP.init()