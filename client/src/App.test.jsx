import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import axios from 'axios';

vi.mock('axios');

describe('App Component', () => {
  it('renders the Dashboard title and headers', async () => {
    // Mock the initial API responses to prevent errors
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/questions/due')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/questions')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/analytics/activity')) {
        return Promise.resolve({ data: { dailyActivity: {}, stats: {} } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<App />);

    // Check for main title
    expect(screen.getByText(/DSA Tracker/i)).toBeInTheDocument();
    
    // Wait for the components to render
    await waitFor(() => {
      expect(screen.getByText(/Data Structures & Algorithms/i)).toBeInTheDocument();
      expect(screen.getByText(/Log Question/i)).toBeInTheDocument();
    });
  });
});
