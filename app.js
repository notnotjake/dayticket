const APP = {
	init() {
		DRAW.removeJSMessage()
		DRAW.setDatePicker()
		
		if ( DATA.key.isValid() ) {
			APP.getData([DATA.materials,DATA.labor])
		} else {
			DRAW.auth()
		}
	},
	getData(dataObjList) {
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
						APP.connected()
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
	connected() {
		DATA.key.renew(30)
		DRAW.connectedStatus()
		DRAW.setToolbarActive()
		//DRAW.addSingleUse()
	},
	renderData(dataObj) {
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
	printButton() {
		document.title = 'Dayticket_' + DATA.form.builder() + '_Lot-' + DATA.form.lot() +'_' + DATA.form.dateString()
		DRAW.printingPress()
		window.print()
		document.title = 'Dayticket Entry'
		DRAW.printingPull()
	},
	exportButton() {
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
	clearButton() {
		const event = new Event('input')
		document.querySelectorAll('input').forEach( (x) => {
			x.value = ''
		})
		DATA.materials.includes().forEach( x => {
			x.qty = ''
		})
		DATA.labor.includes().forEach( x => {
			x.qty = ''
		})
		DRAW.setDatePicker()
		//clear needs to also clear the qty stored in the data layer
	},
}
const DRAW = {
	elementFactory(elem, options) {
		let objectNode = document.createElement(elem)
		if (options) {
			Object.entries(options).forEach( x => {
				if (x[0] == 'text') {
					objectNode.innerText = x[1]
				}
				else if (x[0] == 'html') {
					objectNode.innerHTML = x[1]
				}
				else {
					objectNode.setAttribute(x[0], x[1])
				}
			})
		}
		return objectNode
	},
	removeJSMessage() {
		document.querySelector('.js-message').remove()
	},
	setToolbarActive() {
		document.querySelector('#date').disabled = false
		document.querySelector('#builder').disabled = false
		document.querySelector('#lot').disabled = false
		document.querySelector('#billing').disabled = false
		document.querySelector('.input p').style.color = '#000000'
		document.querySelector('#print').disabled = false
		document.querySelector('#export').disabled = false
		document.querySelector('#clear').disabled = false
	},
	connectedStatus() {
		let connected = DRAW.elementFactory('div', {
			html:'<h2><i class="bi bi-cloud-check-fill"></i> Connected • <a href="https://airtable.com/tblGUdN0uXXlqKKlJ/">Edit AirTable Data</a>',
			class:'app-status'
		})
		document.querySelector('.app-controls').insertAdjacentElement('afterbegin', connected)
	},
	setDatePicker() {
		var dateField = document.querySelector('#date')
		var date = new Date()
		dateField.value = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0) + '-' + date.getDate().toString().padStart(2, 0)
	},
	auth(condition) {
		if (typeof condition == 'undefined') {
			let authForm = DRAW.elementFactory('div', {
				html:'<h2>Authenticate</h2><p>You\'re device will be remembered for 30 days</p>',
				class:'auth-container'
			})

			let form = DRAW.elementFactory('div', {class:'new-auth'})
			let input = DRAW.elementFactory('input', {
				type:'text',
				id:'new-auth-key',
				placeholder:'Security Key',
				autofocus:'true',
				required:'true',
				onclick:'select()'
			})
			input.value = DATA.key.value()
			let button = DRAW.elementFactory('button', {
				html: '<i class="bi bi-arrow-right-circle-fill"></i>',
				id:'new-auth-enroll',
				disabled:'true',
			})
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
			authForm.appendChild(DRAW.elementFactory('p',{id:'auth-help'}))
			
			document.querySelector('.app-controls').insertAdjacentElement('afterbegin', authForm)
		}
		else {
			document.querySelector('#new-auth-key').value = DATA.key.value()
			document.querySelector('#auth-help').innerHTML = '<i class="bi bi-exclamation-circle-fill"></i>' + condition
		}
		document.querySelector('#new-auth-key').select()
	},
	addSingleUse() {
		let section = DRAW.elementFactory('div', {class:'section-table'})
		let sectionHeader = DRAW.elementFactory('h1', {
			text:'Single Use Items',
			class:''
		})
		section.appendChild(sectionHeader)
		document.querySelector('#column-4').insertAdjacentElement('beforeend', section)
	},
	addSection(column, name, data, headerClass) {
		let section = DRAW.elementFactory('div', {class:'section-table'})
		let sectionList = DRAW.elementFactory('ul', {class:'section-list'})

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
			let itemInput = DRAW.elementFactory('input', {
				type:'number',
				step:'0.01',
				min:'0',
				class:'qty',
				id:'qty'+(x.name),
				onclick:'select()',
				inputmode:'decimal',
				placeholder: placeholderText,
			})
			let itemP = DRAW.elementFactory('p', {text: x.name})
			
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
		
		let sectionHeader = DRAW.elementFactory('h1', {
			text: name,
			class: headerClass
		})
		
		let expandButton = DRAW.elementFactory('button', {
			html: shownIcon,
			class:'expand-button'
		})
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
	showSection(section, button) {
		section.style.display = 'block'
		button.innerHTML = shownIcon
	},
	hideSection(section, button) {
		section.style.display = 'none'
		button.innerHTML = hiddenIcon
	},
	printingPress() {
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
		//materials lines
		DATA.materials.includes().forEach( x => {
			let item = DRAW.elementFactory('div',{class:'table-entry'})
			
			let name = DRAW.elementFactory('p',{
				text: x.name,
				class:'column-1'
			})
			let qty = DRAW.elementFactory('p',{
				text: x.qty,
				class:'column-2'
			})
			let cost = DRAW.elementFactory('p',{class:'column-3'})
			cost.innerText = '$' + parseFloat(x.qty * x.cost).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
			
			item.appendChild(name)
			item.appendChild(qty)
			item.appendChild(cost)
			document.querySelector('#print-materials-table').appendChild(item)
		})
		//labor lines
		DATA.labor.includes().forEach( x => {
			let item = DRAW.elementFactory('div',{class:'table-entry'})
			
			let name = DRAW.elementFactory('p',{
				text: `${x.name} ($${x.regWage}/hr)`,
				class:'column-1'
			})
			let qty = DRAW.elementFactory('p',{
				text: x.qty,
				class:'column-2'
			})
			let cost = DRAW.elementFactory('p',{class:'column-3'})
			cost.innerText = '$' + parseFloat(x.qty * x.regWage).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
			
			item.appendChild(name)
			item.appendChild(qty)
			item.appendChild(cost)
			document.querySelector('#print-labor-table').appendChild(item)
		})
		//materials sales tax
		let materialsTaxLine = DRAW.elementFactory('div',{class:'table-entry total-line'})
		materialsTaxLine.appendChild(DRAW.elementFactory('p',{
			text:'Sales Tax',
			class:'column-1'
		}))
		materialsTaxLine.appendChild(DRAW.elementFactory('p',{
			text:`$${DATA.materials.salesTax()}`,
			class:'column-2'
		}))
		document.querySelector('#print-materials-table').appendChild(materialsTaxLine)
	},
	printingPull() {
		document.querySelector('#print-labor-table').innerHTML = ''
		document.querySelector('#print-materials-table').innerHTML = ''
	},
	collapseAll() {
		document.querySelector('#showcollapseBtn').innerText = 'Expand All'
		document.querySelector('#showcollapseBtn').setAttribute('onClick','DRAW.expandAll()')
		
		document.querySelectorAll('.section-table').forEach( x => {
			DRAW.hideSection(x.querySelector('ul'),x.querySelector('button'))
		})
	},
	expandAll() {
		document.querySelector('#showcollapseBtn').innerText = 'Collapse All'
		document.querySelector('#showcollapseBtn').setAttribute('onClick','DRAW.collapseAll()')
		
		document.querySelectorAll('.section-table').forEach( x => {
			DRAW.showSection(x.querySelector('ul'),x.querySelector('button'))
		})
	}
}

class ITEM {
	constructor(name, section, cost, unit) {
		this.name = name
		this.section = section
		this.cost = cost
		this.unit = unit
		this.qty = 0.00
	}
}
class RATE {
	constructor(name, regWage, otWage) {
		this.name = name
		this.regWage = regWage
		this.otWage = otWage
		this.unit = 'hrs'
		this.qty = 0.00
	}
}
const DATA = {
	totalCost() {
		let totalCost = parseFloat(DATA.materials.total()) + parseFloat(DATA.labor.total())
		return totalCost.toFixed(2)
	},
	grossProfit() {
		let num = (DATA.form.billing() - DATA.totalCost()).toFixed(2)
		let perc = ((num / DATA.form.billing())*100).toFixed(1)
		
		return {num:num, perc:perc}
	},
	form: {
		date() {
			let date = new Date(document.querySelector('#date').value)
			return date
		},
		dateString() {
			let date = new Date(document.querySelector('#date').value)
			return (date.getMonth() + 1) + '/' + (date.getDate() + 1) + '/' + date.getFullYear()
		},
		builder() {
			return document.querySelector('#builder').value
		},
		lot() {
			return document.querySelector('#lot').value
		},
		billing() {
			return document.querySelector('#billing').value
		}
	},
	materials: {
		name: 'Materials',
		at: 'Materials?view=Sorted',
		data: [],
		parseData(data) {
			data.forEach( i => {
				DATA.materials.data.push(new ITEM(i.fields.name, i.fields.section, i.fields.cost, i.fields.unit))
			})
		},
		sections: [['Prewire & Cable', 1],['Cable Ends & Jacks', 1],['Faceplate & Trimout', 2],['Sound, AV, & Automation', 2],['Alarm/Security', 3],['Central Vac', 3]],
		includes() {
			let includesData = []
			DATA.materials.data.forEach( x => {
				if (x.qty) {
					includesData.push(x)
				}
			})
			return includesData
		},
		total() {
			let total = 0
			DATA.materials.includes().forEach( x => {
				total += (x.qty * x.cost) * 1.06
			})
			return total.toFixed(2)
		},
		salesTax() {
			let tax = 0
			DATA.materials.includes().forEach( x => {
				tax += (x.qty * x.cost) * 0.06
			})
			return tax.toFixed(2)
		}
	},
	labor: {
		name: 'Labor',
		at: 'Labor?view=Sorted',
		data: [],
		parseData(data) {
			data.forEach( i => {
				DATA.labor.data.push(new RATE(i.fields.name, i.fields.regular, i.fields.overtime))
			})
		},
		includes() {
			let includesData = []
			DATA.labor.data.forEach( x => {
				if (x.qty) {
					includesData.push(x)
				}
			})
			return includesData
		},
		total() {
			let total = 0
			DATA.labor.includes().forEach( x => {
				total += x.qty * x.regWage
			})
			return total.toFixed(2)
		}
	},
	freshCookies() {
		return document.cookie
	},
	bakeCookies(key, value, days) {
		var date = new Date()
		date.setTime(date.getTime() + (days*24*60*60*1000) )
		var expires = 'expires='+date.toUTCString()
		document.cookie = key + '=' + value + ';' + expires + ';'
		
		console.log('API Key Set (' + value + ')')
	},
	key: {
		name: 'apiKey',
		value() {
			let end = DATA.freshCookies().length
			let i = DATA.freshCookies().indexOf(';', DATA.freshCookies().indexOf(DATA.key.name + '='))
			if ( i >= 0 ) { end = i }
			
			return DATA.freshCookies().slice(DATA.freshCookies().indexOf(DATA.key.name + '=') + DATA.key.name.length + 1, end)
		},
		isValid() {
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
		renew(days) {
			let keyValue = DATA.key.value()
			DATA.bakeCookies(DATA.key.name, keyValue, days)
			console.log('API Key Cookie Extended for 30 Days')
		}
	},
	formatInput(type, input) {
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
	mathInline(n) {
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