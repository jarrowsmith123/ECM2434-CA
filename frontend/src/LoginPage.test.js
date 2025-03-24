import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';

// Create a mock navigate function
const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock the lucide-react X icon
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch = jest.fn();
  });

  test('renders login form by default', () => {
    render(<LoginPage />);
    
    // Check that login elements are visible
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Need an account? Sign up')).toBeInTheDocument();
    
    // Email field should not be visible in login mode
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  test('switches to signup form when clicking on signup link', () => {
    render(<LoginPage />);
    
    // Click on the signup toggle button
    fireEvent.click(screen.getByText('Need an account? Sign up'));
    
    // Check that signup elements are visible
    expect(screen.getByText('Create new account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument();
    expect(screen.getByText(/I accept the/)).toBeInTheDocument();
  });

  test('shows error when attempting to register without accepting terms', async () => {
    render(<LoginPage />);
    
    // Switch to signup form
    fireEvent.click(screen.getByText('Need an account? Sign up'));
    
    // Fill in the form without checking the policy checkbox
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    
    // Check that error message is shown
    await waitFor(() => {
      expect(screen.getByText('You must accept the Terms and Conditions to create an account')).toBeInTheDocument();
    });
  });

  test('opens terms and conditions popup when clicking on the link', () => {
    render(<LoginPage />);
    
    // Switch to signup form
    fireEvent.click(screen.getByText('Need an account? Sign up'));
    
    // Click on the terms and conditions link
    fireEvent.click(screen.getByText('Terms and Conditions'));
    
    // Find the popup with text that includes "1 - Introduction" (using regex instead of exact match)
    const popupTextElement = screen.getByText(/1 - Introduction/);
    expect(popupTextElement).toBeInTheDocument();
    
    // Check for specific content in paragraph form
    expect(screen.getByText(/This Privacy Policy and Terms of Conditions document/)).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    // Mock successful login response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access: 'fake-access-token', refresh: 'fake-refresh-token' }),
    });

    render(<LoginPage />);
    
    // Fill in the login form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      // Check that tokens were saved to localStorage
      expect(localStorage.getItem('accessToken')).toBe('fake-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('fake-refresh-token');
      
      // Check navigation to home page
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  test('handles failed login', async () => {
    // Mock failed login response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    });

    render(<LoginPage />);
    
    // Fill in the login form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      // Check error message is displayed
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      
      // Check localStorage was not updated
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});