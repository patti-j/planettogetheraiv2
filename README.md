# PlanetTogether - AI-First Manufacturing SCM + APS System

<div align="center">
  <img src="attached_assets/Copy of logo-icon_250px_1754109283906.PNG" alt="PlanetTogether Logo" width="150">
  
  **Transform Your Manufacturing Operations with AI-Powered Intelligence**
  
  [![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
</div>

## 🏭 Features

- **Manufacturing Process Management**: Complete support for both discrete and process manufacturing
- **AI-Powered Optimization**: Intelligent scheduling and resource allocation with OpenAI GPT-4
- **Advanced Production Scheduling**: Bryntum Scheduler Pro integration for visual Gantt charts
- **Real-time Analytics**: Manufacturing KPIs and performance metrics
- **Resource Management**: Comprehensive resource planning and allocation
- **Quality Control**: Quality management and compliance tracking
- **Mobile Responsive**: Full mobile and tablet support with optimized navigation

## 🚀 Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, React Flow
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI for intelligent recommendations
- **Visualization**: React Flow for dynamic schema visualization
- **Styling**: Tailwind CSS with shadcn/ui components

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/planettogether-erp.git
   cd planettogether-erp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables in `.env`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/manufacturing_erp
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=development
   SESSION_SECRET=your_session_secret_here
   ```

4. **Set up the database**
   ```bash
   # Create database and push schema
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## 📖 Usage

### Manufacturing Management
- Create and manage production orders, bills of materials, and routings
- Track inventory levels and material requirements
- Monitor production progress and quality metrics

### Schema Visualization
- Explore the complete database schema with interactive visualizations
- Use multiple layout algorithms (hierarchical, circular, force-directed)
- Filter by manufacturing workflows (discrete vs process production)

### AI-Powered Features
- Intelligent scheduling recommendations
- Automated resource allocation optimization
- Predictive analytics for production planning

## 🏗️ Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── lib/            # Utility libraries
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express backend API
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database storage layer
│   ├── db.ts              # Database connection
│   └── seed.ts            # Database seeding
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle database schema
└── docs/                   # Documentation
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migration files
- `npm run db:seed` - Seed database with sample data

## 🌟 Key Features

### Manufacturing Workflows
- **Discrete Manufacturing**: Bill of materials, routings, work centers
- **Process Manufacturing**: Recipes, formulations, batch tracking
- **Quality Management**: Inspections, specifications, compliance

### Advanced Visualization
- **Interactive Schema Explorer**: Navigate complex database relationships
- **Multiple Layout Algorithms**: Choose optimal visualization for your needs
- **Content-Aware Positioning**: Smart layout based on table content
- **Relationship Filtering**: Focus on specific data connections

### AI Integration
- **Smart Scheduling**: AI-powered production optimization
- **Resource Allocation**: Intelligent resource assignment
- **Predictive Analytics**: Forecasting and trend analysis

## 🚀 Deployment

### Replit Deployment
This application is optimized for Replit deployment:

1. Import the repository to Replit
2. Configure environment variables in Replit Secrets
3. The application will automatically deploy

### Self-Hosted Deployment
For production deployment:

1. Build the application
   ```bash
   npm run build
   ```

2. Set up production environment variables
3. Deploy to your preferred hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the schema visualization for database structure understanding

## 🔮 Future Roadmap

- Advanced AI scheduling algorithms
- IoT device integration
- Real-time production monitoring
- Advanced analytics dashboards
- Mobile app development

---

Built with ❤️ for modern manufacturing management