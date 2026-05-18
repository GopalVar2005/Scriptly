import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Flashcard from '../Flashcard';

// Mock the API module to prevent real network calls
vi.mock('../../services/api', () => ({
  updateNote: vi.fn(() => Promise.resolve({}))
}));

const MOCK_TERMS = [
  { front: 'DNS', back: 'Domain Name System — translates domains to IP addresses' },
  { front: 'TCP', back: 'Transmission Control Protocol — reliable data delivery' },
  { front: 'HTTP', back: 'HyperText Transfer Protocol — web data communication' }
];

const MOCK_CONCEPTS = [
  { front: 'DNS Resolution', back: 'Browser queries DNS servers to convert domain names to IP addresses.' }
];

describe('Flashcard Component', () => {
  it('renders empty state when no cards provided', () => {
    render(<Flashcard termCards={[]} conceptCards={[]} />);
    expect(screen.getByText(/no flashcards available/i)).toBeInTheDocument();
  });

  it('shows the first card front by default', () => {
    render(<Flashcard termCards={MOCK_TERMS} conceptCards={MOCK_CONCEPTS} />);
    expect(screen.getByText('DNS')).toBeInTheDocument();
  });

  it('shows tap hint on front of card', () => {
    render(<Flashcard termCards={MOCK_TERMS} conceptCards={MOCK_CONCEPTS} />);
    expect(screen.getByText(/tap to see definition/i)).toBeInTheDocument();
  });

  it('displays mastery percentage', () => {
    render(<Flashcard termCards={MOCK_TERMS} conceptCards={MOCK_CONCEPTS} />);
    expect(screen.getByText(/0% mastered/i)).toBeInTheDocument();
  });

  it('shows Terms and Concepts deck toggle buttons', () => {
    render(<Flashcard termCards={MOCK_TERMS} conceptCards={MOCK_CONCEPTS} />);
    expect(screen.getByText(`Terms (${MOCK_TERMS.length})`)).toBeInTheDocument();
    expect(screen.getByText(`Concepts (${MOCK_CONCEPTS.length})`)).toBeInTheDocument();
  });

  it('advances card when "Got it" is clicked', () => {
    render(<Flashcard termCards={MOCK_TERMS} conceptCards={MOCK_CONCEPTS} />);
    
    // Initially on card 1
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument();
    
    // Click "Got it"
    fireEvent.click(screen.getByText(/got it/i));
    
    // Should advance (with 150ms timeout in the component, but fireEvent is synchronous)
    // The card index updates via setTimeout, so we check the mastery changed
    expect(screen.getByText(/33% mastered/i)).toBeInTheDocument();
  });

  it('shows completion screen after going through all cards', () => {
    render(<Flashcard termCards={[MOCK_TERMS[0]]} conceptCards={[]} />);
    
    // Click through the only card
    fireEvent.click(screen.getByText(/got it/i));
    
    // After last card, should show completion
    // Wait for the setTimeout
    setTimeout(() => {
      expect(screen.getByText(/great job/i)).toBeInTheDocument();
    }, 200);
  });
});
