const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Load ticket data
let ticketData = null;
const dataPath = path.join(__dirname, 'ticket_export.json');

// Load data on startup
try {
  const rawData = fs.readFileSync(dataPath, 'utf8');
  ticketData = JSON.parse(rawData);
  console.log('Ticket data loaded successfully');
} catch (error) {
  console.error('Error loading ticket data:', error);
  process.exit(1);
}

// Helper function to get user info
function getUserById(userId) {
  if (!ticketData.users) return null;
  return ticketData.users.find(u => u.import_id === userId);
}

// API endpoint to get tickets with pagination and search
app.get('/api/tickets', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    let tickets = ticketData.tickets || [];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      tickets = tickets.filter(ticket => 
        (ticket.summary && ticket.summary.toLowerCase().includes(searchLower)) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchLower)) ||
        (ticket.ticket_number && ticket.ticket_number.toString().includes(searchLower))
      );
    }

    // Filter by status
    if (status) {
      tickets = tickets.filter(ticket => ticket.status === status);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      tickets = tickets.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      tickets = tickets.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate <= end;
      });
    }

    // Sort by ticket number (descending)
    tickets.sort((a, b) => (b.ticket_number || 0) - (a.ticket_number || 0));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTickets = tickets.slice(startIndex, endIndex);

    // Add user information to tickets
    const enrichedTickets = paginatedTickets.map(ticket => {
      const assignedUser = getUserById(ticket.assigned_to);
      const createdUser = getUserById(ticket.created_by);
      
      return {
        ...ticket,
        assigned_user: assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : 'Unassigned',
        created_user: createdUser ? `${createdUser.first_name} ${createdUser.last_name}` : 'Unknown',
        comment_count: ticket.Comments ? ticket.Comments.length : 0
      };
    });

    res.json({
      tickets: enrichedTickets,
      pagination: {
        total: tickets.length,
        page,
        limit,
        totalPages: Math.ceil(tickets.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get a single ticket by ID
app.get('/api/tickets/:id', (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const tickets = ticketData.tickets || [];
    const ticket = tickets.find(t => t.import_id === ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Enrich comments with user information
    const enrichedComments = (ticket.Comments || []).map(comment => {
      const user = getUserById(comment.created_by);
      return {
        ...comment,
        user_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown'
      };
    });

    const assignedUser = getUserById(ticket.assigned_to);
    const createdUser = getUserById(ticket.created_by);

    res.json({
      ...ticket,
      assigned_user: assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : 'Unassigned',
      created_user: createdUser ? `${createdUser.first_name} ${createdUser.last_name}` : 'Unknown',
      Comments: enrichedComments
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ticket statistics
app.get('/api/stats', (req, res) => {
  try {
    const tickets = ticketData.tickets || [];
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      pending: tickets.filter(t => t.status === 'pending').length
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
