# Performance Management System (PMS)

A modern, full-stack Performance & Goal Management System built with React, Node.js, and MongoDB. This system enables employees to set and track goals, managers to review and approve goals, and provides comprehensive feedback mechanisms.

## Features

### Core Functionality
- **Role-based Authentication**: Employee, Manager, and Admin roles with specific permissions
- **Goal Management**: Create, submit, approve, reject, and track goals with weightage
- **Deadlines & Notifications**: Set a deadline on each goal, receive an email on creation, and a reminder 1 day before deadline
- **Feedback System**: Self-feedback and manager feedback with ratings
- **Dashboard Analytics**: Role-specific dashboards with insights and statistics
- **Approval Workflows**: Structured goal approval process with rejection reasons

### User Roles & Permissions

#### Employee
- Create and manage personal goals
- Submit goals for manager approval
- Update completion percentage
- Submit self-feedback
- View own feedback history

#### Manager
- Review and approve/reject team goals
- Set goal weightage during approval
- Provide performance feedback
- View team member progress
- Monitor pending approvals

#### Admin
- View all users, goals, and feedback
- Access comprehensive system statistics
- Monitor overall system health
- Manage user accounts

## Tech Stack

### Frontend
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing

## Project Structure

```
project/
 backend/
   models/          # Mongoose models (User, Goal, Feedback)
   routes/          # API routes
   controllers/     # Route controllers
   middleware/      # Custom middleware (auth, validation)
   server.js        # Express server entry point
   package.json     # Backend dependencies
   .env.example     # Environment variables template

 frontend/
   src/
     components/    # Reusable React components
     pages/         # Page components (Login, Dashboard, etc.)
     context/       # React context (Auth)
     services/      # API service layer
     App.js         # Main application component
     index.js       # React entry point
     index.css      # Global styles with Tailwind
   package.json     # Frontend dependencies
   tailwind.config.js # Tailwind configuration
   postcss.config.js # PostCSS configuration
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pms
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. **Start the backend server**
   ```bash
   # For development
   npm run dev
   
   # For production
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the React development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "employee"
}
```

#### POST /api/auth/login
User login
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me
Get current user profile (protected)

### Goal Endpoints

#### GET /api/goals
Get goals based on user role (protected)

#### POST /api/goals
Create new goal (employees only)
```json
{
  "title": "Learn React",
  "description": "Complete React tutorial and build a project",
  "managerId": "manager_id_here"
}
```

#### PUT /api/goals/:id
Update goal (protected)

#### PUT /api/goals/:id/approve
Approve goal (managers only)
```json
{
  "weightage": 25
}
```

#### PUT /api/goals/:id/reject
Reject goal (managers only)
```json
{
  "rejectionReason": "Goal needs more specific metrics"
}
```

### Feedback Endpoints

#### GET /api/feedback/user/:userId
Get feedback for a user (protected)

#### POST /api/feedback
Submit feedback (protected)
```json
{
  "userId": "user_id_here",
  "goalId": "goal_id_here",
  "rating": 4,
  "comments": "Good progress on the goal",
  "type": "manager"
}
```

#### GET /api/feedback/pending
Get pending feedback for managers (protected)

### User Endpoints (Admin Only)

#### GET /api/users
Get all users

#### GET /api/users/dashboard/stats
Get dashboard statistics

## Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['employee', 'manager', 'admin']),
  timestamps: true
}
```

### Goal Model
```javascript
{
  title: String (required),
  description: String (required),
  status: String (enum: ['Draft', 'Pending Approval', 'Active', 'Completed']),
  weightage: Number (0-100, set by manager),
  completionPercentage: Number (0-100),
  createdBy: ObjectId (ref: 'User'),
  managerId: ObjectId (ref: 'User'),
  rejectionReason: String,
  timestamps: true
}
```

### Feedback Model
```javascript
{
  userId: ObjectId (ref: 'User', required),
  goalId: ObjectId (ref: 'Goal', required),
  givenBy: ObjectId (ref: 'User', required),
  rating: Number (1-5, required),
  comments: String (required),
  type: String (enum: ['self', 'manager'], required),
  timestamps: true
}
```

## Goal Lifecycle

1. **Draft**: Employee creates goal
2. **Pending Approval**: Employee submits for review
3. **Active**: Manager approves with weightage
4. **Completed**: Goal marked as completed

## Authentication Flow

1. User registers/logs in
2. JWT token generated and stored
3. Token sent with each API request
4. Middleware validates token and role
5. Protected routes accessible based on role

## Development Notes

### Environment Variables
- Keep `JWT_SECRET` secure and unique
- Use different MongoDB URIs for development/production
- Consider using environment variable management in production

#### SMTP (Email Notifications)
To enable emails on goal creation and the 1-day-before-deadline reminders, configure SMTP in `backend/.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (optional)

If SMTP is not configured, goal creation will still work, but emails will fail.

### Security Features
- Password hashing with bcryptjs
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration

### UI/UX Features
- Responsive design with Tailwind CSS
- Modern, clean interface
- Status badges and progress indicators
- Form validation and error handling
- Loading states and user feedback

## Deployment

### Backend Deployment
1. Set production environment variables
2. Install production dependencies
3. Start server with process manager (PM2)
4. Configure reverse proxy (nginx)
5. Set up SSL certificates

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy to static hosting service
3. Configure routing for SPA
4. Set up environment variables for API URL

## Testing

### Manual Testing Workflow
1. Register users with different roles
2. Test goal creation and approval flow
3. Verify feedback submission and viewing
4. Test role-based access controls
5. Validate dashboard statistics

### Test Cases to Consider
- User registration and login
- Goal creation, submission, approval, rejection
- Feedback submission and retrieval
- Role-based permissions
- Error handling and validation
- Dashboard data accuracy

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify MongoDB is running
   - Check connection string in .env
   - Ensure network accessibility

2. **JWT Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Verify token storage in localStorage

3. **CORS Issues**
   - Ensure CORS is configured properly
   - Check frontend API base URL
   - Verify allowed origins

4. **Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

## Future Enhancements

### Potential Features
- Email notifications for goal updates
- Advanced reporting and analytics
- Goal templates and suggestions
- Performance review cycles
- Integration with calendar systems
- Mobile application
- Advanced user permissions
- Audit logging
- Data export functionality

### Performance Optimizations
- Database indexing
- API response caching
- Image optimization
- Code splitting
- Lazy loading

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Built with modern web technologies for efficient performance management.**
