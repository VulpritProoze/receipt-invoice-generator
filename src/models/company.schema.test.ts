import { companyConfigSchema } from './company';

describe('companyConfigSchema', () => {
  const validCompanyConfig = {
    brandName: 'BillGen',
    companyName: 'BillGen Inc.',
    companyUrl: 'https://billgen.example.com',
    addressLine: '123 Test Street',
    postalAddress: 'Makati City, 1200',
    country: 'Philippines',
    logoUrl: 'https://billgen.example.com/logo.png'
  };

  it('accepts a valid company config', () => {
    expect(companyConfigSchema.parse(validCompanyConfig)).toEqual(
      validCompanyConfig
    );
  });

  it('rejects invalid company urls', () => {
    expect(
      companyConfigSchema.safeParse({
        ...validCompanyConfig,
        companyUrl: 'not-a-url'
      }).success
    ).toBe(false);
  });
});
