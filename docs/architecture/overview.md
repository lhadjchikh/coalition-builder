# System Architecture Overview

This document provides a high-level overview of the Coalition Builder system architecture, including components, data flow, and deployment patterns.

## Architecture Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│      Users      │      │  Load Balancer  │      │   Monitoring    │
│                 │      │      (ALB)      │      │  (CloudWatch)   │
└────────┬────────┘      └────────┬────────┘      └─────────────────┘
         │                        │                        ▲
         │               ┌────────┼────────┐               │
         ▼               │        ▼        │               │
┌─────────────────┐      │ ┌─────────────┐ │               │
│  Frontend/SSR   │      │ │ ECS Service │ │───────────────┘
│   (React/Next)  │◄─────┤ │             │ │
└─────────────────┘      │ │ ┌─────────┐ │ │
                         │ │ │ Django  │ │ │
┌─────────────────┐      │ │ │   API   │ │ │
│   Django Admin  │◄─────┤ │ │  (port  │ │ │
│                 │      │ │ │  8000)  │ │ │
└─────────────────┘      │ │ └─────────┘ │ │
                         │ │             │ │
                         │ │ ┌─────────┐ │ │
                         │ │ │   SSR   │ │ │
                         │ │ │ Next.js │ │ │
                         │ │ │  (port  │ │ │
                         │ │ │  3000)  │ │ │
                         │ │ └─────────┘ │ │
                         │ └─────────────┘ │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   PostgreSQL    │
                         │   + PostGIS     │
                         └─────────────────┘
```

## Core Components

### Frontend Applications

**React Frontend** (`frontend/`)

- Single-page application built with React and TypeScript
- Provides interactive user interface for browsing campaigns and stakeholders
- Communicates with Django API via REST endpoints
- Optimized for user interaction and dynamic content

**Next.js SSR** (`ssr/`) - Optional

- Server-side rendered application for improved SEO
- Pre-renders pages on the server for faster initial load times
- Falls back gracefully if backend API is unavailable
- Includes health monitoring and metrics endpoints

### Backend Services

**Django API** (`backend/`)

- RESTful API built with Django and Django Ninja
- Handles all business logic and data management
- Provides admin interface for content management
- Includes authentication, validation, and data serialization

**PostgreSQL Database**

- Primary data store with PostGIS extension for geographic data
- Stores campaigns, stakeholders, endorsements, and homepage content
- Supports complex queries and spatial data operations
- Configured for high availability and backup in production

## Data Architecture

### Core Models

```
HomePage
├── ContentBlock (1:N)
├── organization_name
├── hero_title/subtitle
└── contact_information

PolicyCampaign
├── title, slug, summary
├── description (rich text)
├── active status
└── created/updated timestamps

Stakeholder
├── name, organization
├── contact information
├── type (farmer, business, etc.)
└── geographic location

Endorsement
├── Stakeholder (FK)
├── PolicyCampaign (FK)
├── statement (optional)
└── public visibility
```

### Content Management Flow

```
Django Admin → Models → API Endpoints → Frontend Display
     ▲            │
     │            ▼
   Users      Database Storage
```

## Deployment Architecture

### Development Environment

```
Developer Machine
├── Docker Compose
│   ├── Django (port 8000)
│   ├── PostgreSQL (port 5432)
│   └── Frontend Dev Server (port 3000)
└── Optional: SSR Dev Server (port 3001)
```

### Production Environment (AWS)

```
Internet
    │
    ▼
Application Load Balancer (ALB)
    │
    ├── /api/* → Target Group 1: Django API (port 8000)
    ├── /admin/* → Target Group 1: Django API (port 8000)
    ├── /static/* → Target Group 1: Django API (port 8000)
    └── /* (default) → Target Group 2: SSR (port 3000)
                │
                ▼
        ECS Fargate Service (Single Task Definition)
                │
                ├── Django API Container (port 8000)
                └── SSR Container (port 3000)
                        │
                        ▼
                RDS PostgreSQL
                └── PostGIS Extension
```

## Technology Stack

### Backend Technologies

- **Python 3.13** - Core language
- **Django 5.2** - Web framework
- **Django Ninja** - API framework (FastAPI-inspired)
- **PostgreSQL 16** - Database
- **PostGIS** - Spatial database extension
- **Poetry** - Dependency management

### Frontend Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Next.js 14** - SSR framework (optional)
- **Material-UI/Tailwind** - UI components
- **Axios** - HTTP client

### Infrastructure Technologies

- **Docker** - Containerization
- **AWS ECS** - Container orchestration
- **AWS RDS** - Managed database
- **AWS ALB** - Load balancing
- **Terraform** - Infrastructure as Code
- **GitHub Actions** - CI/CD

## Data Flow

### User Interaction Flow

1. **User accesses application** → ALB routes to appropriate service
2. **Frontend/SSR requests data** → API endpoints in Django
3. **Django processes request** → Database queries via ORM
4. **Data returned as JSON** → Frontend renders interface
5. **User interactions** → API calls for CRUD operations

### Content Management Flow

1. **Admin logs into Django admin** → Authentication and authorization
2. **Admin creates/edits content** → Form validation and processing
3. **Content saved to database** → Model validation and constraints
4. **Frontend fetches updated content** → API endpoint returns JSON
5. **Users see updated content** → Dynamic rendering on frontend

### API Request Flow

```
Frontend/SSR → Django Middleware → URL Router → View Function → Database
                    ▲                                              │
                    │                                              ▼
                Response ← JSON Serialization ← Business Logic ← ORM Query
```

## Security Architecture

### Authentication & Authorization

- Django's built-in authentication for admin users
- Session-based authentication for admin interface
- API endpoints currently public (read-only)
- Future: Token-based authentication for API access

### Data Protection

- Input validation and sanitization
- CORS configuration for cross-origin requests
- SQL injection protection via Django ORM
- XSS protection for user-generated content

### Infrastructure Security

- VPC with private subnets for database
- Security groups restricting network access
- HTTPS/TLS encryption in transit
- Database encryption at rest
- AWS Secrets Manager for credential storage

## Scalability Considerations

### Horizontal Scaling

- **Frontend**: Can be deployed to CDN for global distribution
- **ECS Service**: Auto-scaling based on CPU/memory metrics (scales both containers together)
- **Database**: Read replicas for improved read performance

### Performance Optimization

- **Caching**: API response caching for frequently accessed data
- **Database**: Indexing on frequently queried fields
- **Frontend**: Code splitting and lazy loading
- **SSR**: Static generation for cacheable content

### Monitoring & Observability

- CloudWatch logs for application monitoring
- Health check endpoints for service monitoring
- Metrics collection for performance analysis
- Alerting for critical issues

## Development Workflow

### Local Development

1. **Setup**: Docker Compose for local services
2. **Development**: Hot reloading for frontend and backend
3. **Testing**: Comprehensive test suite across all components
4. **Quality Assurance**: Linting, formatting, and type checking

### CI/CD Pipeline

1. **Code Push** → GitHub triggers workflow
2. **Testing** → Run test suite for all components
3. **Building** → Create Docker images for deployment
4. **Deployment** → Update ECS services with new images
5. **Verification** → Health checks confirm successful deployment

## Configuration Management

### Environment-Based Configuration

- **Development**: Local environment variables and Docker Compose
- **Production**: AWS Secrets Manager and environment variables
- **Testing**: Separate test database and mock services

### Feature Toggles

- Optional SSR deployment via Terraform variables
- Configurable content sections via Django admin
- Environment-specific API endpoints and settings

## Future Architecture Considerations

### Potential Enhancements

- **Microservices**: Breaking monolithic Django app into focused services
- **Event-Driven Architecture**: Using message queues for async processing
- **Multi-tenancy**: Supporting multiple organizations in single deployment
- **Real-time Features**: WebSocket support for live updates
- **Mobile Apps**: API-first design supports future mobile development

### Technology Evolution

- **Database**: Potential migration to distributed database for scale
- **Frontend**: Micro-frontend architecture for large teams
- **Infrastructure**: Kubernetes for more sophisticated orchestration
- **Analytics**: Data warehouse integration for reporting and analytics

This architecture provides a solid foundation for advocacy organizations while maintaining flexibility for future growth and customization.
