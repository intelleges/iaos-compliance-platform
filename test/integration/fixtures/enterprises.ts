/**
 * Multi-Enterprise Test Fixtures
 * Based on INT.DOC.23 Section 4 - Multi-Tenant Isolation Tests
 * 
 * Provides test data for two separate enterprises to test isolation
 */

export const testEnterprises = {
  enterpriseA: {
    id: 100,
    description: 'Test Enterprise A',
    instanceName: 'enterprise-a',
    companyName: 'Test Enterprise A Inc.',
    adminUser: {
      id: 1001,
      openId: 'admin-a@test.com',
      email: 'admin-a@test.com',
      name: 'Admin A',
      role: 'admin' as const,
      enterpriseId: 100,
    },
    managerUser: {
      id: 1002,
      openId: 'manager-a@test.com',
      email: 'manager-a@test.com',
      name: 'Manager A',
      role: 'compliance_officer' as const,
      enterpriseId: 100,
    },
    touchpoint: {
      id: 10001,
      name: 'Touchpoint A1',
      code: 'TPA1',
      enterpriseId: 100,
      status: 'active' as const,
    },
    partner: {
      id: 20001,
      companyName: 'Partner A1',
      dunsNumber: '111111111',
      cageCode: 'AAA11',
      enterpriseId: 100,
    },
  },
  enterpriseB: {
    id: 200,
    description: 'Test Enterprise B',
    instanceName: 'enterprise-b',
    companyName: 'Test Enterprise B Inc.',
    adminUser: {
      id: 2001,
      openId: 'admin-b@test.com',
      email: 'admin-b@test.com',
      name: 'Admin B',
      role: 'admin' as const,
      enterpriseId: 200,
    },
    managerUser: {
      id: 2002,
      openId: 'manager-b@test.com',
      email: 'manager-b@test.com',
      name: 'Manager B',
      role: 'compliance_officer' as const,
      enterpriseId: 200,
    },
    touchpoint: {
      id: 20001,
      name: 'Touchpoint B1',
      code: 'TPB1',
      enterpriseId: 200,
      status: 'active' as const,
    },
    partner: {
      id: 30001,
      companyName: 'Partner B1',
      dunsNumber: '222222222',
      cageCode: 'BBB22',
      enterpriseId: 200,
    },
  },
};
