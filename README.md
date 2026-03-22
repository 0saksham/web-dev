# IKS GEHU Portal

A modern, browser-based web application for IKS GEHU with frontend and backend separation, responsive design, and comprehensive routing.

## Features

- 🎨 **Modern UI/UX**: Clean, responsive design that works on all devices
- 🚀 **Fast Development**: Built with React and Vite for optimal performance
- 🔄 **Full Routing**: React Router for seamless navigation
- 📱 **Responsive Design**: Mobile-first approach with breakpoints for all screen sizes
- 🔧 **Environment Configuration**: Separate configs for frontend and backend
- 🎯 **API Integration**: Express backend with RESTful API endpoints
- 🔐 **Role-Based Authentication**: Three user roles with separate authentication flows
  - IKS Campus In-Charge
  - SPOC (Single Point of Contact)
  - IKS Admin Office
- ✨ **Role Selection**: Landing page with role selection before authentication
- 📊 **Role-Specific Dashboards**: Customized dashboards for each user role

## Project Structure

```
iks-university-portal/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable components (Layout, etc.)
│   │   ├── pages/         # Page components
│   │   │   ├── LandingPage.jsx    # Role selection page
│   │   │   ├── AuthPage.jsx       # Authentication page
│   │   │   ├── RegisterPage.jsx   # Registration page
│   │   │   ├── Dashboard.jsx      # Role-specific dashboard
│   │   │   ├── About.jsx
│   │   │   └── Contact.jsx
│   │   ├── utils/          # Utility functions
│   │   │   ├── roleStorage.js    # Role management utilities
│   │   │   ├── campusValidation.js  # Campus/branch validation
│   │   │   └── api.js       # API utility functions
│   │   ├── App.jsx        # Main app component with routing
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
├── backend/           # Express backend API
│   ├── database/      # Database files
│   │   ├── schema.sql    # Database schema
│   │   ├── db.js         # Database connection
│   │   └── README.md     # Database documentation
│   ├── models/        # Data models
│   │   ├── User.js       # User model
│   │   ├── Event.js      # Event model
│   │   ├── EventMedia.js # Event media model
│   │   └── EventStatus.js # Event status model
│   ├── middleware/    # Express middleware
│   │   └── auth.js      # Authentication middleware
│   ├── utils/         # Utility functions
│   │   ├── password.js    # Password hashing
│   │   ├── jwt.js        # JWT utilities
│   │   └── campusValidation.js  # Campus validation
│   ├── server.js      # Main server file
│   └── package.json
├── package.json       # Root package.json with scripts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install all dependencies** (root, frontend, and backend):
   ```bash
   npm run install:all
   ```

   Or install manually:
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Set up environment variables**:
   
   Copy the example environment files:
   ```bash
   cp backend/env.example backend/.env
   cp frontend/env.example frontend/.env
   ```
   
   Edit the `.env` files as needed. For production, set a strong `JWT_SECRET` in `backend/.env`:
   ```
   JWT_SECRET=your-very-secure-secret-key-here
   JWT_EXPIRES_IN=24h
   ```

### Running the Application

**Development Mode** (runs both frontend and backend):
```bash
npm run dev
```

This will start:
- Frontend on `http://localhost:3000`
- Backend API on `http://localhost:5000`

**Run separately**:

Frontend only:
```bash
npm run dev:frontend
```

Backend only:
```bash
npm run dev:backend
```

### Building for Production

Build the frontend:
```bash
npm run build
```

The built files will be in `frontend/dist/`.

## Available Routes

### Frontend Routes
- `/` - Landing page with role selection
- `/auth/:roleType` - Authentication page for selected role
- `/register/:roleType` - Registration page (Campus In-Charge & SPOC only)
- `/dashboard/:roleType` - Role-specific dashboard (requires authentication)
- `/about` - About page
- `/contact` - Contact page with form

### Backend API Routes

**Authentication:**
- `GET /api/health` - Health check endpoint
- `POST /api/contact` - Contact form submission
- `POST /api/auth/register` - User registration (Campus In-Charge & SPOC only)
- `POST /api/auth/login` - User authentication endpoint
- `GET /api/auth/me` - Get current user info (requires authentication)

**Events:**
- `GET /api/events` - Get all events (role-based filtering)
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event (requires authentication)
- `PUT /api/events/:id` - Update event (creator or admin only)
- `DELETE /api/events/:id` - Delete event (creator or admin only)
- `POST /api/events/:id/media` - Add media to event
- `POST /api/events/:id/status` - Update event status (admin only)

## Authentication System

### Security Features
- **Password Hashing**: Uses bcrypt with salt rounds for secure password storage
- **JWT Tokens**: JSON Web Tokens for session management (24h expiration)
- **Role-Based Access**: Different authentication flows for different roles
- **Protected Routes**: JWT middleware protects API endpoints

### Registration & Login

#### Self-Registration (Campus In-Charge & SPOC)
- Users with these roles can create their own accounts
- Registration form validates:
  - Email format
  - Password strength (minimum 8 characters)
  - Password confirmation match
- Upon successful registration, users are automatically logged in

#### Pre-Created Accounts (Admin Office)
- Admin Office accounts are pre-created by system administrators
- Self-registration is **not allowed** for this role
- Default admin credentials:
  - Email: `admin@iksuniversity.edu`
  - Password: `Admin@123`
- Contact system administrator for additional admin accounts

### User Flow

1. **Landing Page**: Users must select one of three roles:
   - IKS Campus In-Charge
   - SPOC (Single Point of Contact)
   - IKS Admin Office

2. **Role Selection**: Selected role is stored in localStorage and user is routed to the appropriate authentication page.

3. **Authentication**:
   - **Campus In-Charge & SPOC**: Can either login with existing account or register new account
   - **Admin Office**: Can only login (registration link is hidden)

4. **Registration** (Campus In-Charge & SPOC only):
   - Enter name, email, and password
   - Password must be at least 8 characters
   - Email must be unique
   - Upon successful registration, automatically logged in

5. **Login**:
   - Enter email and password
   - Credentials are verified against hashed passwords
   - JWT token is generated and stored
   - Role is verified to match selected role

6. **Dashboard**: Upon successful authentication, users are redirected to their role-specific dashboard with customized features and content.

7. **Token Verification**: Dashboard verifies JWT token with backend on load

8. **Logout**: Users can logout from the dashboard, which clears their role and authentication token, returning them to the landing page.

## Technologies Used

### Frontend
- **React 18** - UI library
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and dev server
- **Axios** - HTTP client (for API calls)

### Backend
- **Express** - Web framework
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT token generation and verification
- **better-sqlite3** - SQLite database driver

## Development

### Adding New Pages

1. Create a new component in `frontend/src/pages/`
2. Add a route in `frontend/src/App.jsx`
3. Optionally add a navigation link in `frontend/src/components/Layout.jsx`

### Adding New API Endpoints

Add new routes in `backend/server.js` following the existing pattern.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for IKS GEHU

