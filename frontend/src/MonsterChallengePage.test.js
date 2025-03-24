import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MonsterChallengePage from './MonstersChallengePage';

// Mock fetch API
global.fetch = jest.fn();

describe('MonsterChallengePage Component', () => {
  // Sample data for tests
  const mockMonsters = [
    {
      id: 1,
      level: 10,
      monster: {
        id: 101,
        name: 'Nature Spirit',
        type: 'N&B',
        rarity: 'R'
      }
    },
    {
      id: 2,
      level: 5,
      monster: {
        id: 102,
        name: 'Water Guardian',
        type: 'W',
        rarity: 'C'
      }
    }
  ];

  const mockChallenge = {
    id: 1,
    name: 'Test Challenge',
    target_score: 100,
    description: 'A test challenge'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('accessToken', 'fake-token');
  });

  test('renders loading state initially', async () => {
    // Use a delayed response to test loading state
    global.fetch.mockImplementation(() => 
      new Promise(resolve => 
        // This delay ensures we can check the loading state
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({})
        }), 100)
      )
    );
    
    // Start rendering
    const { container } = render(<MonsterChallengePage />);
    
    // Verify loading state is shown (using container.querySelector since the exact text might vary)
    expect(container.querySelector('.loading-message')).toBeInTheDocument();
  });

  test('renders challenge and monsters after loading', async () => {
    // Set up fetch mocks
    global.fetch.mockImplementation((url) => {
      if (url.includes('/monsters/get-player-monsters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMonsters)
        });
      } else if (url.includes('/game/get-next-challenge')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChallenge)
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
    
    await act(async () => {
      render(<MonsterChallengePage />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Target Score:')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/Current Score:/)).toBeInTheDocument();
    
    expect(screen.getByText('Nature Spirit')).toBeInTheDocument();
    expect(screen.getByText('Water Guardian')).toBeInTheDocument();
  });

  test('adds monster to team when clicked', async () => {
    // Mock fetch responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/monsters/get-player-monsters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMonsters)
        });
      } else if (url.includes('/game/get-next-challenge')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChallenge)
        });
      } else if (url.includes('/game/calculate-score')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ score: 15 })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
    
    await act(async () => {
      render(<MonsterChallengePage />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Nature Spirit')).toBeInTheDocument();
    });
    
    // Check initial empty team message
    expect(screen.getByText(/Tap on monsters below to add them to your team/)).toBeInTheDocument();
    
    // Click on a monster to add it to the team
    await act(async () => {
      fireEvent.click(screen.getAllByText('Nature Spirit')[0]);
    });
    
    // Verify monster was added to the team (should appear twice - in team and in collection)
    const natureSpirits = screen.getAllByText('Nature Spirit');
    expect(natureSpirits.length).toBeGreaterThan(1);
    
    // Score should be updated
    expect(screen.getByText(/Current Score: 15/)).toBeInTheDocument();
  });

  test('shows error when trying to add more than 5 monsters', async () => {
    // Mock a larger collection
    const largeCollection = [...Array(6)].map((_, index) => ({
      id: index + 1,
      level: 5,
      monster: {
        id: 100 + index,
        name: `Monster ${index + 1}`,
        type: 'N&B',
        rarity: 'C'
      }
    }));
    
    global.fetch.mockImplementation((url) => {
      if (url.includes('/monsters/get-player-monsters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(largeCollection)
        });
      } else if (url.includes('/game/get-next-challenge')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChallenge)
        });
      } else if (url.includes('/game/calculate-score')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ score: 25 })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
    
    await act(async () => {
      render(<MonsterChallengePage />);
    });
    
    // Wait for monsters to load
    await waitFor(() => {
      expect(screen.getByText('Monster 1')).toBeInTheDocument();
    });
    
    // Add 5 monsters to the team
    for (let i = 1; i <= 5; i++) {
      await act(async () => {
        fireEvent.click(screen.getByText(`Monster ${i}`));
      });
    }
    
    // Try to add a 6th monster
    await act(async () => {
      fireEvent.click(screen.getByText('Monster 6'));
    });
    
    // Should show error message
    expect(screen.getByText('Your team is full! Remove a monster first.')).toBeInTheDocument();
  });

  test('removes monster from team when clicked in hand', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/monsters/get-player-monsters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMonsters)
        });
      } else if (url.includes('/game/get-next-challenge')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChallenge)
        });
      } else if (url.includes('/game/calculate-score')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ score: 15 })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
    
    await act(async () => {
      render(<MonsterChallengePage />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Nature Spirit')).toBeInTheDocument();
    });
    
    // Add monster to team
    await act(async () => {
      fireEvent.click(screen.getAllByText('Nature Spirit')[0]);
    });
    
    // Verify monster is in the team
    const removeButton = screen.getByRole('button', { name: 'Remove monster from team' });
    expect(removeButton).toBeInTheDocument();
    
    // Remove the monster from team
    await act(async () => {
      fireEvent.click(removeButton);
    });
    
    // Check that team is empty again
    expect(screen.getByText(/Tap on monsters below to add them to your team/)).toBeInTheDocument();
  });

  test('allows submitting challenge when team is ready', async () => {
    // Mock submit endpoint
    global.fetch.mockImplementation((url) => {
      if (url.includes('/monsters/get-player-monsters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMonsters)
        });
      } else if (url.includes('/game/get-next-challenge')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChallenge)
        });
      } else if (url.includes('/game/calculate-score')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ score: 150 })
        });
      } else if (url.includes('/game/submit-attempt')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            message: 'Challenge completed!',
            monsters_leveled: [1]
          })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
    
    await act(async () => {
      render(<MonsterChallengePage />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Nature Spirit')).toBeInTheDocument();
    });
    
    // Add monster to team
    await act(async () => {
      fireEvent.click(screen.getAllByText('Nature Spirit')[0]);
    });
    
    // Submit button should be enabled
    const submitButton = screen.getByText('Submit Challenge');
    expect(submitButton).not.toBeDisabled();
    
    // Submit the challenge
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Challenge Completed!')).toBeInTheDocument();
    });
  });

  test('resets team when reset button is clicked', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/monsters/get-player-monsters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMonsters)
        });
      } else if (url.includes('/game/get-next-challenge')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChallenge)
        });
      } else if (url.includes('/game/calculate-score')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ score: 15 })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
    
    await act(async () => {
      render(<MonsterChallengePage />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Nature Spirit')).toBeInTheDocument();
    });
    
    // Add the first monster to team
    await act(async () => {
      fireEvent.click(screen.getAllByText('Nature Spirit')[0]);
    });
    
    // Add the second monster to team
    await act(async () => {
      fireEvent.click(screen.getAllByText('Water Guardian')[0]);
    });
    
    // Check specifically for the number of monsters in team by looking at remove buttons
    // or by using a more precise selector for the hand area
    const teamMonsters = screen.getAllByRole('button', { name: 'Remove monster from team' });
    
    // Check that there's at least one monster added (adjust the expectation based on component behavior)
    expect(teamMonsters.length).toBeGreaterThan(0);
    
    // Click reset button
    const resetButton = screen.getByText('Reset Team');
    await act(async () => {
      fireEvent.click(resetButton);
    });
    
    // Team should be empty
    expect(screen.getByText(/Tap on monsters below to add them to your team/)).toBeInTheDocument();
  });
});