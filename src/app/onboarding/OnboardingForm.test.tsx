/**
 * Tests for OnboardingForm component
 * Tests form validation, submission, and user interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingForm from './OnboardingForm';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('OnboardingForm', () => {
  const mockPush = jest.fn();
  const testUserID = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Form rendering', () => {
    it('should render all form fields', () => {
      render(<OnboardingForm userID={testUserID} />);

      expect(screen.getByLabelText(/brand name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company legal name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company website/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/logo url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/city, state\/province/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });

    it('should render submit button as disabled initially', () => {
      render(<OnboardingForm userID={testUserID} />);

      const submitButton = screen.getByRole('button', {
        name: /complete setup/i
      });
      expect(submitButton).toBeDisabled();
    });

    it('should show required indicators on all fields', () => {
      render(<OnboardingForm userID={testUserID} />);

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators).toHaveLength(7); // All 7 fields are required
    });
  });

  describe('Form validation', () => {
    it('should show validation error for empty brand name on blur', async () => {
      render(<OnboardingForm userID={testUserID} />);

      const brandNameInput = screen.getByLabelText(/brand name/i);
      fireEvent.focus(brandNameInput);
      fireEvent.blur(brandNameInput);

      await waitFor(() => {
        expect(screen.getByText(/brand name is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid URL', async () => {
      render(<OnboardingForm userID={testUserID} />);

      const urlInput = screen.getByLabelText(/company website/i);
      fireEvent.change(urlInput, { target: { value: 'not-a-valid-url' } });
      fireEvent.blur(urlInput);

      await waitFor(() => {
        expect(screen.getByText(/must be a valid url/i)).toBeInTheDocument();
      });
    });

    it('should clear validation error when valid input is provided', async () => {
      render(<OnboardingForm userID={testUserID} />);

      const brandNameInput = screen.getByLabelText(/brand name/i);

      // Trigger error
      fireEvent.blur(brandNameInput);
      await waitFor(() => {
        expect(screen.getByText(/brand name is required/i)).toBeInTheDocument();
      });

      // Fix error
      fireEvent.change(brandNameInput, {
        target: { value: 'Valid Brand Name' }
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/brand name is required/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should validate brand name max length', async () => {
      render(<OnboardingForm userID={testUserID} />);

      const brandNameInput = screen.getByLabelText(/brand name/i);
      fireEvent.change(brandNameInput, { target: { value: 'a'.repeat(101) } });
      fireEvent.blur(brandNameInput);

      await waitFor(() => {
        expect(
          screen.getByText(/must not exceed 100 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should enable submit button when all fields are valid', async () => {
      render(<OnboardingForm userID={testUserID} />);

      // Fill all fields with valid data
      fireEvent.change(screen.getByLabelText(/brand name/i), {
        target: { value: 'Test Brand' }
      });
      fireEvent.change(screen.getByLabelText(/company legal name/i), {
        target: { value: 'Test Company Inc.' }
      });
      fireEvent.change(screen.getByLabelText(/company website/i), {
        target: { value: 'https://example.com' }
      });
      fireEvent.change(screen.getByLabelText(/logo url/i), {
        target: { value: 'https://example.com/logo.png' }
      });
      fireEvent.change(screen.getByLabelText(/street address/i), {
        target: { value: '123 Test Street' }
      });
      fireEvent.change(screen.getByLabelText(/city, state\/province/i), {
        target: { value: 'Test City, TS 12345' }
      });
      fireEvent.change(screen.getByLabelText(/country/i), {
        target: { value: 'Test Country' }
      });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /complete setup/i
        });
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form submission', () => {
    const validFormData = {
      brandName: 'Test Brand',
      companyName: 'Test Company Inc.',
      companyUrl: 'https://example.com',
      logoUrl: 'https://example.com/logo.png',
      addressLine: '123 Test Street',
      postalAddress: 'Test City, TS 12345',
      country: 'Test Country'
    };

    const fillForm = () => {
      fireEvent.change(screen.getByLabelText(/brand name/i), {
        target: { value: validFormData.brandName }
      });
      fireEvent.change(screen.getByLabelText(/company legal name/i), {
        target: { value: validFormData.companyName }
      });
      fireEvent.change(screen.getByLabelText(/company website/i), {
        target: { value: validFormData.companyUrl }
      });
      fireEvent.change(screen.getByLabelText(/logo url/i), {
        target: { value: validFormData.logoUrl }
      });
      fireEvent.change(screen.getByLabelText(/street address/i), {
        target: { value: validFormData.addressLine }
      });
      fireEvent.change(screen.getByLabelText(/city, state\/province/i), {
        target: { value: validFormData.postalAddress }
      });
      fireEvent.change(screen.getByLabelText(/country/i), {
        target: { value: validFormData.country }
      });
    };

    it('should submit form with valid data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' })
      });

      render(<OnboardingForm userID={testUserID} />);
      fillForm();

      const submitButton = screen.getByRole('button', {
        name: /complete setup/i
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userID: testUserID,
            ...validFormData
          })
        });
      });
    });

    it('should redirect to dashboard on successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' })
      });

      render(<OnboardingForm userID={testUserID} />);
      fillForm();

      const submitButton = screen.getByRole('button', {
        name: /complete setup/i
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state during submission', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<OnboardingForm userID={testUserID} />);
      fillForm();

      const submitButton = screen.getByRole('button', {
        name: /complete setup/i
      });
      fireEvent.click(submitButton);

      expect(screen.getByText(/completing setup/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should display error message on submission failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Submission failed' })
      });

      render(<OnboardingForm userID={testUserID} />);
      fillForm();

      const submitButton = screen.getByRole('button', {
        name: /complete setup/i
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
      });
    });

    it('should not submit form with invalid data', async () => {
      render(<OnboardingForm userID={testUserID} />);

      // Fill only some fields
      fireEvent.change(screen.getByLabelText(/brand name/i), {
        target: { value: 'Test Brand' }
      });
      fireEvent.change(screen.getByLabelText(/company legal name/i), {
        target: { value: 'Test Company' }
      });

      const submitButton = screen.getByRole('button', {
        name: /complete setup/i
      });
      expect(submitButton).toBeDisabled();

      // Try to submit (should not call fetch)
      fireEvent.click(submitButton);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for invalid fields', async () => {
      render(<OnboardingForm userID={testUserID} />);

      const brandNameInput = screen.getByLabelText(/brand name/i);
      fireEvent.blur(brandNameInput);

      await waitFor(() => {
        expect(brandNameInput).toHaveAttribute('aria-invalid', 'true');
        expect(brandNameInput).toHaveAttribute(
          'aria-describedby',
          'brandName-error'
        );
      });
    });

    it('should associate error messages with inputs', async () => {
      render(<OnboardingForm userID={testUserID} />);

      const brandNameInput = screen.getByLabelText(/brand name/i);
      fireEvent.blur(brandNameInput);

      await waitFor(() => {
        const errorMessage = screen.getByText(/brand name is required/i);
        expect(errorMessage).toHaveAttribute('id', 'brandName-error');
      });
    });
  });
});

// Made with Bob
