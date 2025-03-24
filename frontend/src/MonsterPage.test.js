import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MonstersPage from './MonstersPage';

// Mock react-router-dom's useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock fetch API
global.fetch = jest.fn();

describe('MonstersPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('accessToken', 'fake-token');
  });

  test('renders loading state initially', async () => {
    // Mock fetch that never resolves during this test
    global.fetch.mockImplementation(() => new Promise(() => {}));
    
    await act(async () => {
      render(<MonstersPage />);
    });
    
    expect(screen.getByText('Loading your monsters...')).toBeInTheDocument();
  });

  test('renders monsters when API call succeeds', async () => {
    // Mock successful API response with monsters
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 1,
          level: 5,
          monster: {
            id: 101,
            name: 'Water Dragon',
            type: 'W',
            rarity: 'R'
          }
        },
        {
          id: 2,
          level: 3,
          monster: {
            id: 102,
            name: 'Recycle Bot',
            type: 'WA',
            rarity: 'C'
          }
        }
      ])
    });
    
    await act(async () => {
      render(<MonstersPage />);
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your monsters...')).not.toBeInTheDocument();
    });
    
    // Check for monster cards
    expect(screen.getByText('Monster Collection')).toBeInTheDocument();
    expect(screen.getByText('Water Dragon')).toBeInTheDocument();
    expect(screen.getByText('Recycle Bot')).toBeInTheDocument();
    
    // Check for rarity badges
    expect(screen.getByText('Rare')).toBeInTheDocument();
    expect(screen.getByText('Common')).toBeInTheDocument();
    
    // Check that Play Game button is present
    expect(screen.getByText('Play Game')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    // Mock failed API response
    global.fetch.mockRejectedValueOnce(new Error('Failed to fetch monsters'));
    
    await act(async () => {
      render(<MonstersPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load monsters. Please try again later.')).toBeInTheDocument();
    });
  });

  test('navigates to monsters challenge page when Play Game button is clicked', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    });
    
    await act(async () => {
      render(<MonstersPage />);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading your monsters...')).not.toBeInTheDocument();
    });
    
    // Click Play Game button
    fireEvent.click(screen.getByText('Play Game'));
    
    // Check if navigation was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/monsters_challenge');
  });

  test('displays empty grid when user has no monsters', async () => {
    // Mock successful API response with empty array
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    });
    
    await act(async () => {
      render(<MonstersPage />);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading your monsters...')).not.toBeInTheDocument();
    });
    
    // Check that the monsters grid is empty (by ensuring it exists but has no monster cards)
    const monstersGrid = document.querySelector('.monsters-grid');
    expect(monstersGrid).toBeInTheDocument();
    expect(monstersGrid.children.length).toBe(0);
  });

  test('makes API call with correct authorization header', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    });
    
    await act(async () => {
      render(<MonstersPage />);
    });
    
    // Check that fetch was called with correct URL and headers
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/monsters/get-player-monsters/',
      {
        headers: {
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json'
        }
      }
    );
  });
});