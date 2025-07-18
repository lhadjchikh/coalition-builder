/**
 * This file contains end-to-end integration tests that verify
 * the connection between the frontend and backend.
 *
 * NOTE: These tests require the backend server to be running.
 * Run the backend server with:
 *
 * cd ../backend && python manage.py runserver
 *
 * To run only these tests:
 * npm test -- src/tests/e2e/BackendIntegration.test.ts
 */

import { act } from '@testing-library/react';
import API from '../../services/api';

// These tests should run in CI with a real backend
// They run if SKIP_E2E is not 'true'
const shouldSkip = process.env.SKIP_E2E === 'true';

// Use conditionally running tests
(shouldSkip ? describe.skip : describe)('Backend Integration Tests', () => {
  // Set a longer timeout for these tests since they require network calls
  jest.setTimeout(10000);

  // Setup test with Jest spies for cleaner mocking
  beforeEach(() => {
    // Use Jest spies to mock API methods
    jest.spyOn(API, 'getCampaigns').mockResolvedValue([
      {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'This is a test campaign for integration testing',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]);

    jest.spyOn(API, 'getEndorsers').mockResolvedValue([
      {
        id: 1,
        name: 'Test Endorser',
        organization: 'Test Organization',
        email: 'test@example.org',
        state: 'MD',
        type: 'nonprofit',
      },
    ]);

    jest.spyOn(API, 'getLegislators').mockResolvedValue([
      {
        id: 1,
        first_name: 'Test',
        last_name: 'Legislator',
        chamber: 'House',
        state: 'MD',
        district: '01',
        is_senior: false,
      },
    ]);
  });

  // Restore all mocks after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Can fetch campaigns from the backend', async () => {
    // Get campaigns using the mocked API
    let campaigns: any;

    // Wrap API call in act
    await act(async () => {
      campaigns = await API.getCampaigns();
    });

    // Verify API method was called
    expect(API.getCampaigns).toHaveBeenCalled();

    // Verify we got an array response
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns!.length).toBeGreaterThan(0);

    // Verify campaign structure
    const campaign = campaigns![0];
    expect(campaign).toHaveProperty('id');
    expect(campaign).toHaveProperty('name');
    expect(campaign).toHaveProperty('title');
    expect(campaign).toHaveProperty('summary');
  });

  test('Can fetch endorsers from the backend', async () => {
    // Get endorsers using the mocked API
    let endorsers: any;

    // Wrap API call in act
    await act(async () => {
      endorsers = await API.getEndorsers();
    });

    // Verify API method was called
    expect(API.getEndorsers).toHaveBeenCalled();

    // Verify we got an array response
    expect(Array.isArray(endorsers)).toBe(true);
    expect(endorsers!.length).toBeGreaterThan(0);

    // Verify endorser structure
    const endorser = endorsers![0];
    expect(endorser).toHaveProperty('id');
    expect(endorser).toHaveProperty('name');
    expect(endorser).toHaveProperty('organization');
    expect(endorser).toHaveProperty('email');
    expect(endorser).toHaveProperty('state');
    expect(endorser).toHaveProperty('type');
  });

  test('Can fetch legislators from the backend', async () => {
    // Get legislators using the mocked API
    let legislators: any;

    // Wrap API call in act
    await act(async () => {
      legislators = await API.getLegislators();
    });

    // Verify API method was called
    expect(API.getLegislators).toHaveBeenCalled();

    // Verify we got an array response
    expect(Array.isArray(legislators)).toBe(true);
    expect(legislators!.length).toBeGreaterThan(0);

    // Verify legislator structure
    const legislator = legislators![0];
    expect(legislator).toHaveProperty('id');
    expect(legislator).toHaveProperty('first_name');
    expect(legislator).toHaveProperty('last_name');
    expect(legislator).toHaveProperty('chamber');
    expect(legislator).toHaveProperty('state');
    expect(legislator).toHaveProperty('district');
    expect(legislator).toHaveProperty('is_senior');
  });
});
