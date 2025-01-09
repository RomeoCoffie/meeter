# Meeting Scheduler Application

A full-stack application for scheduling meetings between freelancers and clients. Built with React, Node.js, Express, and MySQL.

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Project Structure 

## Installation

1. Clone the repository: 

2. Install server dependencies:

3. Install client dependencies:

4. Set up database:

5. Start the server:

6. Start the client:

## Running the Application

1. Start the server (in server directory):

2. Start the client (in client directory):


The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Meetings
- GET `/api/meetings` - Get user's meetings
- POST `/api/meetings` - Create a new meeting
- PUT `/api/meetings/:id/status` - Update meeting status

### User
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update user profile
- GET `/api/users/availability` - Get user availability
- POST `/api/users/availability` - Update user availability

## Features

1. User Authentication
   - Register as freelancer or client
   - Secure login/logout
   - JWT authentication

2. Meeting Management
   - Create meetings
   - View meetings list
   - Accept/decline meetings
   - Search and filter meetings

3. User Profile
   - View and update profile
   - Manage availability
   - View meeting statistics

## Development

### Running Tests


## Troubleshooting

1. Database Connection Issues
   - Verify MySQL is running
   - Check database credentials in .env
   - Ensure database 'meeting_scheduler' exists

2. Server Won't Start
   - Check if port 5000 is available
   - Verify all dependencies are installed
   - Check server logs for errors

3. Client Connection Issues
   - Verify server is running
   - Check REACT_APP_API_URL in client/.env
   - Look for CORS errors in browser console

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.