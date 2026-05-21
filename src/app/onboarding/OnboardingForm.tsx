'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { companyConfigSchema } from '@/models/company';
import { z } from 'zod';

interface OnboardingFormProps {
  userID: string;
}

export default function OnboardingForm({ userID }: OnboardingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const [formData, setFormData] = useState({
    brandName: '',
    companyName: '',
    companyUrl: '',
    logoUrl: '',
    addressLine: '',
    postalAddress: '',
    country: ''
  });

  // Real-time validation for a single field
  const validateField = (name: string, value: string) => {
    try {
      // Validate single field using Zod schema
      const fieldSchema =
        companyConfigSchema.shape[
          name as keyof typeof companyConfigSchema.shape
        ];
      fieldSchema.parse(value);

      // Clear error if validation passes
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [name]: error.issues[0].message
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate field on change (debounced by user typing)
    if (value) {
      validateField(name, value);
    } else {
      // Clear error when field is empty (will show required error on blur)
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validate all fields
    const result = companyConfigSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userID,
          ...formData
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      setIsSubmitting(false);
    }
  };

  // Check if form is valid (all fields filled and no errors)
  const isFormValid =
    Object.values(formData).every((value) => value.trim() !== '') &&
    Object.keys(errors).length === 0;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white shadow-md rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Complete Your Company Profile
        </h2>
        <p className="text-gray-600 mb-8">
          Please provide your company information to generate professional
          receipts and invoices.
        </p>

        <div className="space-y-6">
          {/* Brand Name */}
          <div>
            <label
              htmlFor="brandName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="brandName"
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., Acme Corp"
              maxLength={100}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.brandName ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.brandName}
              aria-describedby={
                errors.brandName ? 'brandName-error' : undefined
              }
            />
            {errors.brandName && (
              <p id="brandName-error" className="mt-1 text-sm text-red-600">
                {errors.brandName}
              </p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Company Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., Acme Corporation Inc."
              maxLength={200}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.companyName ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.companyName}
              aria-describedby={
                errors.companyName ? 'companyName-error' : undefined
              }
            />
            {errors.companyName && (
              <p id="companyName-error" className="mt-1 text-sm text-red-600">
                {errors.companyName}
              </p>
            )}
          </div>

          {/* Company URL */}
          <div>
            <label
              htmlFor="companyUrl"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Company Website <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="companyUrl"
              name="companyUrl"
              value={formData.companyUrl}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://example.com"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.companyUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.companyUrl}
              aria-describedby={
                errors.companyUrl ? 'companyUrl-error' : undefined
              }
            />
            {errors.companyUrl && (
              <p id="companyUrl-error" className="mt-1 text-sm text-red-600">
                {errors.companyUrl}
              </p>
            )}
          </div>

          {/* Logo URL */}
          <div>
            <label
              htmlFor="logoUrl"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Logo URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="logoUrl"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://example.com/logo.png"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.logoUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.logoUrl}
              aria-describedby={errors.logoUrl ? 'logoUrl-error' : undefined}
            />
            {errors.logoUrl && (
              <p id="logoUrl-error" className="mt-1 text-sm text-red-600">
                {errors.logoUrl}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Direct link to your company logo image
            </p>
          </div>

          {/* Address Line */}
          <div>
            <label
              htmlFor="addressLine"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="addressLine"
              name="addressLine"
              value={formData.addressLine}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., 123 Main Street, Suite 100"
              maxLength={200}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.addressLine ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.addressLine}
              aria-describedby={
                errors.addressLine ? 'addressLine-error' : undefined
              }
            />
            {errors.addressLine && (
              <p id="addressLine-error" className="mt-1 text-sm text-red-600">
                {errors.addressLine}
              </p>
            )}
          </div>

          {/* Postal Address */}
          <div>
            <label
              htmlFor="postalAddress"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              City, State/Province & Postal Code{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="postalAddress"
              name="postalAddress"
              value={formData.postalAddress}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., San Francisco, CA 94102"
              maxLength={100}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.postalAddress ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.postalAddress}
              aria-describedby={
                errors.postalAddress ? 'postalAddress-error' : undefined
              }
            />
            {errors.postalAddress && (
              <p id="postalAddress-error" className="mt-1 text-sm text-red-600">
                {errors.postalAddress}
              </p>
            )}
          </div>

          {/* Country */}
          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., United States"
              maxLength={100}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.country ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.country}
              aria-describedby={errors.country ? 'country-error' : undefined}
            />
            {errors.country && (
              <p id="country-error" className="mt-1 text-sm text-red-600">
                {errors.country}
              </p>
            )}
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{submitError}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              !isFormValid || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
          </button>
        </div>
      </div>
    </form>
  );
}

// Made with Bob
