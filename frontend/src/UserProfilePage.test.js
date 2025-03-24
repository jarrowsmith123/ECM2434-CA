import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfilePage from './UserProfilePage';

// Create a mock navigate function
const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock fetch
global.fetch = jest.fn();

// Mock user data
const mockUserData = {
  username: 'testuser',
  email: 'test@example.com',
  profile: {
    created_at: '2024-01-01T00:00:00Z',
    game_won_count: 5
  }
};

describe('UserProfilePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('accessToken', 'fake-token');
    
    // Mock successful fetch for user profile
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUserData)
    });
  });

  test('redirects to login if no token found', async () => {
    localStorage.removeItem('accessToken');
    
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('fetches and displays user profile data', async () => {
    render(<UserProfilePage />);
    
    // Initially should show loading state
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
    });
    
    // Check that user data is displayed - use regex to make it more flexible
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    // Use a regex to match the date, as the formatting can vary
    expect(screen.getByText(/01\/01\/2024|1\/1\/2024|2024-01-01/)).toBeInTheDocument();
    
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Check that edit and delete buttons are present
    expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
  });

  test('switches to edit mode when clicking Edit Profile', async () => {
    render(<UserProfilePage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
    });
    
    // Click edit button
    fireEvent.click(screen.getByRole('button', { name: 'Edit Profile' }));
    
    // Check that form is now displayed
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    
    // Check that form has user data pre-filled
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    
    expect(usernameInput.value).toBe('testuser');
    expect(emailInput.value).toBe('test@example.com');
    
    // Check that save and cancel buttons are present
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('shows delete confirmation when Delete Account is clicked', async () => {
    render(<UserProfilePage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
    });
    
    // Click delete button
    fireEvent.click(screen.getByRole('button', { name: 'Delete Account' }));
    
    // Confirmation should be displayed
    expect(screen.getByText('Are you sure? This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});