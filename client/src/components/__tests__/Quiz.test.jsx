import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Quiz from '../Quiz';

// Mock the API module
vi.mock('../../services/api', () => ({
  generateQuiz: vi.fn(() => Promise.resolve({ quiz_data: [] }))
}));

const MOCK_QUIZ_DATA = [
  {
    question: 'What does DNS stand for?',
    correct_answer: 'Domain Name System',
    distractors: ['Data Network Service', 'Digital Naming Standard', 'Direct Name Server']
  },
  {
    question: 'What is the correct order of the TCP three-way handshake?',
    correct_answer: 'SYN → SYN-ACK → ACK',
    distractors: ['ACK → SYN → SYN-ACK', 'SYN-ACK → SYN → ACK', 'ACK → SYN-ACK → SYN']
  }
];

describe('Quiz Component', () => {
  it('renders idle state with Start Quiz button', () => {
    render(<Quiz noteId="test123" subject="Networking" cachedQuizData={MOCK_QUIZ_DATA} />);
    expect(screen.getByRole('heading', { name: /test your knowledge/i })).toBeInTheDocument();
    expect(screen.getByText(/start quiz/i)).toBeInTheDocument();
  });

  it('displays the subject in idle state', () => {
    render(<Quiz noteId="test123" subject="Networking" cachedQuizData={MOCK_QUIZ_DATA} />);
    expect(screen.getByText(/networking/i)).toBeInTheDocument();
  });

  it('shows first question after starting quiz', () => {
    render(<Quiz noteId="test123" subject="Networking" cachedQuizData={MOCK_QUIZ_DATA} />);
    
    fireEvent.click(screen.getByText(/start quiz/i));
    
    expect(screen.getByText('What does DNS stand for?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
  });

  it('shows all answer options including correct answer', () => {
    render(<Quiz noteId="test123" subject="Networking" cachedQuizData={MOCK_QUIZ_DATA} />);
    
    fireEvent.click(screen.getByText(/start quiz/i));
    
    expect(screen.getByText('Domain Name System')).toBeInTheDocument();
    expect(screen.getByText('Data Network Service')).toBeInTheDocument();
  });

  it('shows Next Question button after selecting an answer', () => {
    render(<Quiz noteId="test123" subject="Networking" cachedQuizData={MOCK_QUIZ_DATA} />);
    
    fireEvent.click(screen.getByText(/start quiz/i));
    fireEvent.click(screen.getByText('Domain Name System'));
    
    expect(screen.getByText(/next question/i)).toBeInTheDocument();
  });

  it('updates score when correct answer is selected', () => {
    render(<Quiz noteId="test123" subject="Networking" cachedQuizData={MOCK_QUIZ_DATA} />);
    
    fireEvent.click(screen.getByText(/start quiz/i));
    fireEvent.click(screen.getByText('Domain Name System'));
    
    expect(screen.getByText('Score: 1')).toBeInTheDocument();
  });
});
