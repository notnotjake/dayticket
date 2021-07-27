# Advance Day Ticket Entry App
Created by [Jake Gooch](https://www.notnotjake.com) for [Advance](https://www.advanceas.com)

Facilitates data-entry of job costs (material and labor) and generates formatted PDF report with summary of costs and breakdown. Uses a shared AirTable as the 'database'.

**Links:**

🟢 [Live-Site](https://dayticket.advanceas.com)

👋 [User-facing About](https://dayticket.advanceas.com/about)

❓ [User-facing Help](https://dayticket.advanceas.com/help)

## 💡 Functionality
- Enter time ticket data
- Collapse/Expand sections
- Add Single-Use Items (can be material or labor)
- Print a report of costs
- Names PDF with date, builder and lot (for saving to filesystem)

## 🔍 Demo Mode
To demo this web app, enter the Authentication Key `demo`. This will load dummy data from a static json file.

## 🛠 Architecture
- Static site hosted on GitHub Pages
- Client-side rendering of database and PDF
- Uses an AirTable database with shared access between users
- User enters API key which is then stored in cookies for 30 days of inactivity