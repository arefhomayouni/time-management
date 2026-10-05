# ⏰ Time Management System

A comprehensive time tracking and management system where users can:
- Track daily working hours
- Be part of multiple groups
- Set group working rates
- Generate monthly payment reports
- Invite other users to groups
- View personal and group payment histories

## 🏗️ **Architecture**

**Backend:** Node.js + Express + MongoDB
**Frontend:** React + Vanta.js for visual effects
**Database:** MongoDB for users, groups, time records, and payments

## 📁 **Project Structure**

```
time-management/
├── api/                    # Backend API
│   ├── src/
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Business logic
│   │   ├── middlewares/     # Authentication & validation
│   │   └── config/          # Database & config
│   ├── package.json
│   └── README.md
├── client/                  # Frontend React App
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/            # Application pages
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API services
│   │   └── utils/            # Helper functions
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
├── .env
└── README.md
```

## 🔧 **Core Features**

### **User Management**
- **No Admin/Super Admin** - All users can be managers or normal users
- **Personal management** for daily time tracking
- **User invitations** to groups
- **Multiple group membership** per user

### **Group System**
- **Group managers** set working rates
- **Shared rates** for group members
- **Group-only visibility** for member payments
- **Cross-group management** for user reports

### **Time Tracking**
- **Daily time entry** for hours worked
- **Monthly payment calculation** based on rates
- **Payment history** for each user
- **Detailed reports** from managers to users

### **Payment System**
- **Monthly salary calculation**: `(hours worked × rate) - deductions`
- **History tracking** for all payments
- **Manager reports** with exact amounts
- **Transparent billing** with deductions shown

## 🏁 **Usage**

### **Backend Setup**
```bash
cd api
npm install
npm run dev
```

### **Frontend Setup**
```bash
cd client
npm install
npm run dev
```

### **Docker Deployment**
```bash
docker compose up -d --build
```

## 📊 **Data Flow**

1. **User Registration**: New users get auto-generated credentials
2. **Group Management**: Users create/join groups with managers
3. **Time Entry**: Daily tracking of worked hours
4. **Monthly Processing**: Auto-calculate payments
5. **Reporting**: Managers generate user payment reports
6. **History**: All transactions stored for audit

## 🔐 **Security**

- **JWT-based authentication**
- **Role-based access control**
- **Input validation & sanitization**
- **Encrypted passwords**
- **Rate limiting**

## 📈 **Performance**

- **Real-time updates** using WebSockets
- **MongoDB indexing** for fast queries
- **Vanta.js visual effects** for smooth UX
- **Optimized payment calculations**

## 📞 **API Endpoints**

### **Authentication**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### **User Management**
- `GET /api/users/profile`
- `PUT /api/users/update`
- `GET /api/users/invites`

### **Group Management**
- `POST /api/groups/create`
- `GET /api/groups/:id`
- `POST /api/groups/:id/invite`
- `PUT /api/groups/:id/members`

### **Time Tracking**
- `POST /api/time/entries`
- `GET /api/time/user/:userId`
- `GET /api/time/monthly/:userId/:month`

### **Payment System**
- `GET /api/payments/user/:userId`
- `GET /api/payments/group/:groupId`
- `POST /api/payments/calculate/:groupId`

## 🎨 **Frontend Features**

- **Vanta.js integration** for background effects
- **Responsive design** for all devices
- **Real-time notifications**
- **Interactive charts** for time tracking
- **Dark/Light mode** support
- **Multi-language support**

## 🚀 **Development**

This is a **work in progress** project. The backend will follow the same patterns as the EmployeeInfo system but with a focus on:

1. **Simplified architecture** compared to the enterprise-level EmployeeInfo
2. **Flexible group management** system
3. **Transparent payment calculations**
4. **User-friendly interface** with Vanta.js effects

## 🔄 **Comparison with EmployeeInfo**

| Feature | EmployeeInfo | Time Management |
|---------|--------------|-----------------|
| Complexity | High (26+ tables) | Medium (6-8 collections) |
| Architecture | Microservices | Monolith |
| User Types | Multiple levels | Manager/User |
| Rate System | Per-person | Group-based |
| Visual Effects | None | Vanta.js |

This makes Time Management more approachable while keeping core functionality intact.

## 📝 **Next Steps**

1. **Database design** with MongoDB schemas
2. **API endpoint implementation**
3. **Frontend component development**
4. **Authentication integration**
5. **Payment calculation logic**
6. **Group management features**
7. **Testing and deployment**

The system will be built incrementally following agile principles, with continuous integration and thorough testing at each stage.