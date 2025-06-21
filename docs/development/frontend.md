# Frontend Development

This guide covers React frontend development for Coalition Builder, including setup, testing, and best practices.

## Overview

The frontend is a React application with TypeScript that interacts with the Django backend API. It provides a user interface for browsing campaigns, viewing stakeholder information, and displaying dynamic homepage content.

## Technology Stack

- **React 18** - UI library with hooks and functional components
- **TypeScript** - Type safety and enhanced development experience
- **Create React App** - Build tooling and development server
- **Material-UI / TailwindCSS** - UI components and styling
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## Project Structure

```
frontend/
├── public/
│   ├── index.html          # HTML template
│   ├── manifest.json       # PWA manifest
│   └── favicon.ico         # Site icon
├── src/
│   ├── components/         # Reusable React components
│   │   └── CampaignsList.tsx
│   ├── services/          # API client and utilities
│   │   └── api.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── tests/             # Test files
│   │   ├── integration/   # Integration tests with mocked APIs
│   │   └── e2e/          # End-to-end tests with real backend
│   ├── App.tsx            # Main application component
│   ├── index.tsx          # Application entry point
│   └── setupTests.ts      # Test configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000` with hot reloading enabled.

### Environment Variables

Create a `.env` file in the frontend directory:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api

# Optional: Enable development features
REACT_APP_DEBUG=true
```

## Components

### CampaignsList Component

Displays a list of policy campaigns with filtering and sorting capabilities.

```typescript
import React, { useState, useEffect } from 'react';
import { Campaign } from '../types';
import { apiClient } from '../services/api';

export const CampaignsList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await apiClient.getCampaigns();
        setCampaigns(data);
      } catch (err) {
        setError('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Policy Campaigns</h2>
      {campaigns.map(campaign => (
        <div key={campaign.id}>
          <h3>{campaign.title}</h3>
          <p>{campaign.summary}</p>
        </div>
      ))}
    </div>
  );
};
```

### Homepage Component

Renders dynamic homepage content from the backend API with fallback content.

```typescript
import React, { useState, useEffect } from 'react';
import { HomePage } from '../types';
import { apiClient } from '../services/api';

export const HomepageComponent: React.FC = () => {
  const [homepage, setHomepage] = useState<HomePage | null>(null);

  useEffect(() => {
    const fetchHomepage = async () => {
      try {
        const data = await apiClient.getHomepage();
        setHomepage(data);
      } catch (error) {
        // Use fallback content if API fails
        setHomepage({
          organization_name: process.env.REACT_APP_ORG_NAME || 'Coalition Builder',
          tagline: process.env.REACT_APP_TAGLINE || 'Building advocacy partnerships',
          // ... other fallback fields
        });
      }
    };

    fetchHomepage();
  }, []);

  return (
    <div>
      <header>
        <h1>{homepage?.hero_title}</h1>
        <p>{homepage?.hero_subtitle}</p>
      </header>

      <section>
        <h2>{homepage?.about_section_title}</h2>
        <div dangerouslySetInnerHTML={{
          __html: homepage?.about_section_content || ''
        }} />
      </section>

      {homepage?.content_blocks?.map(block => (
        <ContentBlock key={block.id} block={block} />
      ))}
    </div>
  );
};
```

## API Integration

### API Client

The `api.ts` service provides a centralized interface for backend communication:

```typescript
import axios from "axios";
import { Campaign, HomePage, Stakeholder } from "../types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  // Homepage
  getHomepage: (): Promise<HomePage> =>
    apiClient.get("/homepage/").then((response) => response.data),

  // Campaigns
  getCampaigns: (): Promise<Campaign[]> =>
    apiClient.get("/campaigns/").then((response) => response.data),

  getCampaign: (slug: string): Promise<Campaign> =>
    apiClient.get(`/campaigns/${slug}/`).then((response) => response.data),

  // Stakeholders
  getStakeholders: (): Promise<Stakeholder[]> =>
    apiClient.get("/stakeholders/").then((response) => response.data),
};
```

### Error Handling

Implement consistent error handling across components:

```typescript
import { AxiosError } from "axios";

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.status === 404) {
      return "Resource not found";
    }
    if (error.response?.status >= 500) {
      return "Server error. Please try again later.";
    }
  }
  return "An unexpected error occurred";
};
```

## Testing

### Test Structure

The frontend includes comprehensive testing at multiple levels:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test components with mocked API responses
- **End-to-End Tests**: Test the full application flow with a real backend

### Running Tests

```bash
# Run all tests
npm test

# Run tests without watch mode (for CI)
npm run test:ci

# Run only end-to-end tests (requires backend running)
npm run test:e2e

# Run tests with coverage
npm test -- --coverage
```

### Integration Tests

Integration tests verify component behavior with mocked API responses:

```typescript
// src/tests/integration/CampaignsList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { CampaignsList } from '../../components/CampaignsList';
import { api } from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('CampaignsList Integration', () => {
  beforeEach(() => {
    mockedApi.getCampaigns.mockClear();
  });

  test('displays campaigns from API', async () => {
    const mockCampaigns = [
      { id: 1, title: 'Clean Water Act', summary: 'Protect our waterways' },
      { id: 2, title: 'Climate Action', summary: 'Address climate change' },
    ];

    mockedApi.getCampaigns.mockResolvedValue(mockCampaigns);

    render(<CampaignsList />);

    await waitFor(() => {
      expect(screen.getByText('Clean Water Act')).toBeInTheDocument();
      expect(screen.getByText('Climate Action')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockedApi.getCampaigns.mockRejectedValue(new Error('API Error'));

    render(<CampaignsList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load campaigns/i)).toBeInTheDocument();
    });
  });
});
```

### End-to-End Tests

E2E tests verify the complete application flow with a real backend:

```typescript
// src/tests/e2e/BackendIntegration.test.js
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

describe("Backend Integration", () => {
  test("can fetch homepage data from real backend", async () => {
    const response = await fetch(`${API_BASE_URL}/api/homepage/`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("organization_name");
    expect(data).toHaveProperty("content_blocks");
  });

  test("can fetch campaigns from real backend", async () => {
    const response = await fetch(`${API_BASE_URL}/api/campaigns/`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

### Test Setup

Configure Jest and React Testing Library in `setupTests.ts`:

```typescript
import "@testing-library/jest-dom";

// Mock environment variables for tests
process.env.REACT_APP_API_URL = "http://localhost:8000/api";
process.env.REACT_APP_ORG_NAME = "Test Organization";

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

## Code Quality

### TypeScript Configuration

The project uses strict TypeScript settings for better type safety:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix automatically fixable issues
npm run lint:fix

# Check TypeScript types
npm run typecheck
```

### Code Formatting

The project uses Prettier for consistent code formatting:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Build and Deployment

### Production Build

```bash
npm run build
```

This creates optimized production files in the `build/` directory.

### Docker Integration

The frontend can be built and served using Docker:

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment-Specific Builds

Configure different environments through environment variables:

```bash
# Development
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_DEBUG=true

# Production
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_DEBUG=false
```

## Best Practices

### Component Design

1. **Use functional components** with hooks instead of class components
2. **Implement proper TypeScript types** for all props and state
3. **Handle loading and error states** consistently
4. **Use React.memo** for expensive components to prevent unnecessary re-renders
5. **Implement proper accessibility** with semantic HTML and ARIA attributes

### State Management

1. **Use React hooks** (useState, useEffect, useContext) for local state
2. **Consider Context API** for global state that needs to be shared
3. **Implement proper cleanup** in useEffect hooks
4. **Use custom hooks** to extract and reuse stateful logic

### Performance

1. **Lazy load components** that aren't immediately needed
2. **Optimize images** and use appropriate formats
3. **Implement proper caching** for API responses
4. **Use React.memo and useMemo** judiciously to prevent unnecessary re-renders

### Security

1. **Sanitize user input** before rendering HTML content
2. **Use HTTPS** for all API communications
3. **Implement proper CORS** configuration
4. **Don't expose sensitive data** in client-side code

## Troubleshooting

### Common Issues

**API Connection Errors:**

- Verify the backend is running on the correct port
- Check CORS configuration in Django settings
- Ensure `REACT_APP_API_URL` environment variable is set correctly

**Build Failures:**

- Clear node_modules and package-lock.json, then reinstall
- Check for TypeScript errors with `npm run typecheck`
- Ensure all dependencies are compatible versions

**Test Failures:**

- Make sure the backend is running for E2E tests
- Check that mock data matches the expected API response format
- Verify test environment variables are set correctly

For more detailed troubleshooting, see the [main troubleshooting guide](../admin/troubleshooting.md).
