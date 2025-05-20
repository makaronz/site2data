import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ApiKeyInput from '../components/ApiKeyInput';

describe('ApiKeyInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the API key input field', () => {
    render(<ApiKeyInput label="OpenAI API Key" onSave={vi.fn()} />);
    
    expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zapisz/i })).toBeInTheDocument();
  });

  test('calls onSave when save button is clicked with valid input', async () => {
    const mockOnSave = vi.fn();
    
    render(<ApiKeyInput label="OpenAI API Key" onSave={mockOnSave} />);
    
    // Enter API key
    const apiKeyInput = screen.getByLabelText('OpenAI API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test123456789' } });
    
    // Click save button
    const saveButton = screen.getByRole('button', { name: /zapisz/i });
    fireEvent.click(saveButton);
    
    // Check that onSave was called with the correct value
    expect(mockOnSave).toHaveBeenCalledWith('sk-test123456789');
    
    // Check for success message
    expect(await screen.findByText('API Key zapisany!')).toBeInTheDocument();
  });

  test('shows error when trying to save empty API key', async () => {
    const mockOnSave = vi.fn();
    
    render(<ApiKeyInput label="OpenAI API Key" onSave={mockOnSave} />);
    
    // Click save button without entering a key
    const saveButton = screen.getByRole('button', { name: /zapisz/i });
    fireEvent.click(saveButton);
    
    // Check that onSave was not called
    expect(mockOnSave).not.toHaveBeenCalled();
    
    // Check for error message
    expect(await screen.findByText('API Key nie może być pusty.')).toBeInTheDocument();
  });

  test('displays initial value when provided', () => {
    render(<ApiKeyInput label="OpenAI API Key" onSave={vi.fn()} initialValue="sk-initial123456" />);
    
    const apiKeyInput = screen.getByLabelText('OpenAI API Key') as HTMLInputElement;
    expect(apiKeyInput.value).toBe('sk-initial123456');
  });
});
