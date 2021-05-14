var cookies = document.cookie

// check if you have a valid cookie
// valid if: you have one that's apiKey and it isn't null and isn't empty and is at least 15 chars long
var validCookie = false
if (cookies.includes("apikey=") && cookies.substr(cookies.search("apiKey=") + 7).length > 14) {
	console.log("Valid key")
}



// ## Cookie for the API key
// if we don't have the cookie, then we need to get it from the user
// if we have a cookie then we try it with the API
// if the cookie isn't able to bring back data from the API and we have an auth error, then alert the user and ask them to enter the key again
// we also want to update the expiration date so that its 30 days of inactivity requires

// set the cookie
function setCookie() {
	var d = new Date()
	d.setTime(d.getTime() + (30*24*60*60*1000))
	var expires = "expires=" + d.toUTCString()
	let keyVal = prompt("Enter Valid Key")
	document.cookie = "apiKey=" + keyVal + ";" + expires
}
function removeCookie() {
	document.cookie = "apiKey=; expires=Thu, 01 Jan 1970 00:00:00 UTC"
}

function validCookie(cookie) {
	
}


if (cookies.includes("apiKey") && (cookies.substr(cookies.search("apiKey=") + 7) != 0 ) && (cookies.substr(cookies.search("apiKey=") + 7) != "" ) && (cookies.substr(cookies.search("apiKey=") + 7)) != "null" ) {
	console.log(cookies.lastIndexOf("apiKey="))
	console.log(cookies)
} else {
	setCookie()
}

var apiKeyEntered = cookies.substr(cookies.search("apiKey=") + 7)

console.log(apiKeyEntered)




// ## Airtable API
const materialsURL = 'https://api.airtable.com/v0/app9sUZzisuGNjntz/Materials'
const materialsPromise = fetch(materialsURL, {
	method: "GET",
	withCredentials: true,
	headers: {
		"Authorization": `Bearer ${apiKeyEntered}`
	}
})

materialsPromise
	.then(response => response.json())
	.then(data => {
		var sectionsList = []
		var itemsList = []
		data.records.forEach((i) => {
			sectionsList.push(i.fields.section)
			itemsList.push(i.fields.name)
		})
		//sectionsList = sanitizeObj(sectionsList)
		console.log(sectionsList)
		console.log(itemsList)
	})
	.catch(error => console.log("Error with Fetch"))







// ## Buttons
// creates event listener for each button in buttonsList array
function download(filename, text) {
	var element = document.createElement('a')
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
	element.setAttribute('download', filename)
	element.style.display = 'none'
	document.body.appendChild(element)
	element.click()
	document.body.removeChild(element)
}
function print() {
	  var printwin = window.open("");
	  printwin.document.write(document.getElementById("to-print").innerHTML);
	  printwin.stop();
	  printwin.print();
	  printwin.close();
	}

var buttonsList = ['print', 'export', 'clear']
var isUsed = false

for (const i in buttonsList) {
	let button = '#' + buttonsList[i] + 'Button'
	const iButton = document.querySelector(button)
	iButton.addEventListener('click', function(){
		if (buttonsList[i] === 'print') {
			window.print()
			isUsed = true
		} else if (buttonsList[i] === 'export') {
			console.log("Begin export")
			var text = "Hello World"
			var filename = "test.txt"
			download(filename, text)
			isUsed = true
		} else if (buttonsList[i] === 'clear') {
			if (isUsed == true) {
				console.log("Clearing")
				isUsed = false
				removeCookie()
			} else {
				confirm("You haven't printed or exported. Are you sure you want to clear?")
				removeCookie()
			}
		} else {
			console.log(buttonsList[i] + " button pressed!")
		}
	})
}













// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ## Sanitize Object Attribute: 
// takes an object attribute and removes duplicates, and reorders in ascending order
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function sanitizeObj(theObject, theAttribute) {
	var sourceArray = []
	if (typeof theAttribute !== 'undefined') {
		for (const i in theObject) {
			sourceArray.splice(0, 0, theObject[i][theAttribute])
		}
	} else {
		sourceArray = theObject
	}
	
	var newArray = []
	for (const i in sourceArray) { //iterating over each element in the 'source' (original) array
		var unique = false //used to see if source[i] should be added (is a duplicate)
		var spliceIndex = 0 //used to evaluate where source[i] should be inserted
		
		if (newArray.length == 0) { //any value is unique when starting with empty array
			var unique = true
		} else {
			for (const x in newArray) { //iterating over each element in the array we are making
				if (sourceArray[i] == newArray[x]) {
					unique = false
					break // if we see it match we know instantly it's not unique, so we can set that and stop looking
				} else if (sourceArray[i] > newArray[x]) { // is the value of it greater than the source array element
					unique = true // at this point, we think its unique but not proven until we check them all
					spliceIndex ++ // its bigger than this element (newArray[x]) so we increase the index of where it should go
				} else {
					unique = true // it wasn't bigger than newArray[x], but it is unique (as far as we can tell here)
				}
			} // finished iterating over the newArray array
		} // finished evaluating whether it's unique, and figuring out the index
		if (unique) {
			newArray.splice(spliceIndex, 0, sourceArray[i]) // for a unique element, add it at the index we figured out
		}
	}
	return newArray //give back the sanitized array
}







// let materialsColumns = sanitizeObj(materials, "column")
// console.log(materialsColumns)
// 
// 
// // For each column, create the div and then populate that column's div with appropriate content
// // ## Create Div's:
// // For each column in materialsColumns, create a div with a selectable id
// let divsCreated = ""
// for (const i in materialsColumns) {
// 	divsCreated += `<div id="column-${materialsColumns[i]}"></div
// 	`
// }
// console.log(divsCreated)













// // ## Renders the Table for each section
// // Takes each section and then draws the HTML
// function tableRender(section) {
// 	return `
// 		<table>
// 			<tr>
// 				<td colspan="2" class="table-section">${section.sectionName}</td>
// 			</tr>
// 		
// 			${section.item.map(item => `
// 				<tr>
// 					<form>
// 						<td class="qty">
// 							<input type="number" min="1" id="${item.name}-input" required>
// 						</td>
// 						<td>
// 							<label for="${item.name}-input">
// 								${item.name}
// 							</label>
// 						</td>
// 					</form>
// 				</tr>
// 				`).join("")}
// 		</table>
// 	`
// };
// 
// // ## Start Drawing Tables
// // Check if we have access to materials object (in materials.js),
// // Then calls 'tableRender()' to render a table for each section of the materials.
// if (typeof materials !== 'object' ) {
// 	document.getElementById("materials-table").innerHTML = "Can't load materials";
// } else {
// 	document.getElementById("materials-table").innerHTML = `
// 		${materials.map(tableRender).join("")}
// 		`;
// }