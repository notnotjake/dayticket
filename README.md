**_⚠️ This project is a work-in-progress_**
# Advance Day Ticket Entry App
Created by [Jake Gooch](https://www.notnotjake.com) for [Advance](https://www.advanceas.com)


### General Info
🔮 See GitHub [Projects/main](https://github.com/notnotjake/dayticket/projects/1) for current progress and roadmap/issue-log

**Other Links:**

👋 [User-facing About](https://dayticket.advanceas.com/about)

❓ [User-facing Help](https://dayticket.advanceas.com/about)


## 💡 Functionality
- Enter time ticket data (in-progress)
- Print a report of costs (not implemented)
- Export report to QuickBooks IIF Bill file format (not implemented)

## 🛠 Architecture
- Static site
- Hosted on GitHub pages but highly portable (because **✨static**)
- Calls an AirTable database with the AirTable API
	- Uses API Key entered by user on first load
	- Stores API Key in cookies for 30 days (in future this will be stored for 30 days of _inactivity_)
- JavaScript locally renders the page, performs all logic, and data manipulation (including generating print and IIF reports/exports)