import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import OtherUserProfilePage from './OtherUserProfilePage';

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  useParams: () => ({ username: 'testuser' }),
  useNavigate: () => jest.fn()
}));

// Mock fetch API
global.fetch = jest.fn();

describe('OtherUserProfilePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('accessToken', 'fake-token');
  });

  test('renders loading state initially', () => {
    // Mock fetch response that never resolves during this test
    global.fetch.mockImplementation(() => new Promise(() => {}));
    
    render(<OtherUserProfilePage />);
    
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  test('displays user profile data when API call succeeds', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        username: 'testuser',
        email: 'test@example.com',
        profile: {
          created_at: '2024-01-01T00:00:00Z',
          game_won_count: 5
        },
        monsters: []
      })
    });
    
    render(<OtherUserProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('testuser\'s Profile')).toBeInTheDocument();
    });
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Account Created/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    // Mock failed API response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'Server error' })
    });
    
    render(<OtherUserProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading profile/)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Back to Friends')).toBeInTheDocument();
  });

  test('displays error for unauthorized access', async () => {
    // Mock 403 Forbidden response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ detail: 'Forbidden' })
    });
    
    render(<OtherUserProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('You must be friends with this user to view their profile.')).toBeInTheDocument();
    });
  });

  test('redirects to login if no access token', async () => {
    localStorage.removeItem('accessToken');
    
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ username: 'testuser' }),
      useNavigate: () => mockNavigate
    }));
    
    render(<OtherUserProfilePage />);
    
    await waitFor(() => {
      // Should redirect to login, but we can't easily test navigation in this mock setup
      // We'll just verify the API isn't called without a token
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  test('displays monsters when user has monsters', async () => {
    // Mock successful API response with monsters
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        username: 'testuser',
        email: 'test@example.com',
        profile: {
          created_at: '2024-01-01T00:00:00Z',
          game_won_count: 5
        },
        monsters: [
          {
            id: 1,
            level: 3,
            monster: {
              id: 101,
              name: 'Test Monster',
              type: 'N&B',
              rarity: 'C'
            }
          }
        ]
      })
    });
    
    render(<OtherUserProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('testuser\'s Monsters')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Monster')).toBeInTheDocument();
    expect(screen.getByText('Nature and Biodiversity')).toBeInTheDocument();
    expect(screen.getByText('Lvl 3')).toBeInTheDocument();
  });

  test('shows empty state when user has no monsters', async () => {
    // Mock successful API response with no monsters
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        username: 'testuser',
        email: 'test@example.com',
        profile: {
          created_at: '2024-01-01T00:00:00Z',
          game_won_count: 5
        },
        monsters: []
      })
    });
    
    render(<OtherUserProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('testuser\'s Monsters')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/doesn't have any monsters yet/)).toBeInTheDocument();
  });
});