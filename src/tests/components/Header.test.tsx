import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '@/components/Header';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Header Component', () => {
  it('renders the SparkX logo and title', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('SparkX')).toBeInTheDocument();
    expect(screen.getByText(/Intelligent Robot Fleet Management Hub/i)).toBeInTheDocument();
  });

  it('renders the logo icon with letter S', () => {
    renderWithProviders(<Header />);
    const logoText = screen.getByText('S');
    expect(logoText).toBeInTheDocument();
    expect(logoText).toHaveClass('text-white', 'font-bold');
  });

  it('has a header element', () => {
    renderWithProviders(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('displays connection latency indicator', () => {
    renderWithProviders(<Header />);
    const latency = screen.getByText(/\d+\s*ms/);
    expect(latency).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    renderWithProviders(<Header />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
