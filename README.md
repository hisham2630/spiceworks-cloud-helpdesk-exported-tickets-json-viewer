# Spiceworks Ticket Viewer

A lightweight web application for viewing and managing Spiceworks helpdesk ticket exports. Built with Node.js and Express, this tool provides an intuitive interface to browse, search, and filter exported ticket data.

## Features

- 📊 **Dashboard Statistics** - View total, open, and closed ticket counts at a glance
- 🔍 **Advanced Search** - Search tickets by number, summary, or description
- 🎯 **Multiple Filters** - Filter by status (open/closed/pending) and date range
- 📅 **Date Range Filtering** - View tickets within specific time periods
- 📄 **Pagination** - Efficiently browse large ticket datasets
- 👁️ **Detailed View** - Click any ticket to see full details, including comments
- 🎨 **Modern UI** - Clean, responsive design with gradient styling

## Prerequisites

- Node.js (any recent version)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd spiceworks-downloaded-tickets-json-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Place your Spiceworks export file:
   - Export your tickets from Spiceworks in JSON format
   - Rename the file to `ticket_export.json`
   - Place it in the project root directory

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Use the interface to:
   - Search for specific tickets
   - Filter by status (open, closed, pending)
   - Filter by date range (from/to dates)
   - Click on any ticket to view full details and comments
   - Clear all filters with one click

## Project Structure

```
spiceworks-downloaded-tickets-json-viewer/
├── public/              # Frontend files
│   ├── index.html      # Main HTML page
│   ├── app.js          # Frontend JavaScript
│   └── styles.css      # Styling
├── server.js           # Express backend server
├── package.json        # Project dependencies
└── ticket_export.json  # Your Spiceworks data (not in repo)
```

## API Endpoints

- `GET /api/tickets` - Get paginated ticket list with optional filters
  - Query params: `page`, `limit`, `search`, `status`, `startDate`, `endDate`
- `GET /api/tickets/:id` - Get single ticket details with comments
- `GET /api/stats` - Get ticket statistics (total, open, closed, pending)

## Development

For development with auto-reload capabilities, you can use:
```bash
npm run dev
```

## Configuration

The server runs on port 3000 by default. To change this, modify the `PORT` constant in `server.js`.

## Data Format

The application expects a JSON file with the following structure:
```json
{
  "tickets": [...],
  "users": [...],
  "organizations": [...],
  "categories": [...]
}
```

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on GitHub.
