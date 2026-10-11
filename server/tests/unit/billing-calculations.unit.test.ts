import { describe, it, expect } from 'vitest';

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

function calculateInvoiceTotals(items: LineItemInput[], taxPercent: number = 5) {
  let subtotal = 0;
  const processedItems = items.map((item) => {
    const amount = Number((item.quantity * item.unitPrice).toFixed(2));
    subtotal += amount;
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount,
    };
  });

  subtotal = Number(subtotal.toFixed(2));
  const taxRate = taxPercent / 100;
  const tax = Number((subtotal * taxRate).toFixed(2));
  const totalAmount = Number((subtotal + tax).toFixed(2));

  return {
    processedItems,
    subtotal,
    tax,
    totalAmount,
  };
}

function processPaymentMath(
  currentPaid: number,
  totalAmount: number,
  paymentAmount: number,
  currentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID'
) {
  if (currentStatus === 'PAID') {
    throw new Error('This invoice has already been fully settled.');
  }

  const outstanding = Number((totalAmount - currentPaid).toFixed(2));
  if (paymentAmount > outstanding) {
    throw new Error(
      `Payment amount ($${paymentAmount}) exceeds outstanding balance of $${outstanding}.`
    );
  }

  const newPaidAmount = Number((currentPaid + paymentAmount).toFixed(2));
  const newStatus = newPaidAmount >= totalAmount ? 'PAID' : 'PARTIALLY_PAID';

  return {
    newPaidAmount,
    newStatus,
    remainingBalance: Number((totalAmount - newPaidAmount).toFixed(2)),
  };
}

describe('Unit Tests: Billing Arithmetic, Tax Calculators, and Payment State Transitions', () => {
  describe('Invoice Calculation Engine', () => {
    it('should compute exact item amounts and 5% tax for typical hospital services', () => {
      const items: LineItemInput[] = [
        { description: 'Neurology Consultation', quantity: 1, unitPrice: 150.0 },
        { description: 'Brain MRI Scan', quantity: 1, unitPrice: 400.0 },
      ];

      const result = calculateInvoiceTotals(items, 5);

      expect(result.subtotal).toBe(550.0);
      expect(result.tax).toBe(27.5); // 550 * 0.05 = 27.50
      expect(result.totalAmount).toBe(577.5); // 550 + 27.5 = 577.50
    });

    it('should handle fractional unit prices and floating point precision correctly', () => {
      const items: LineItemInput[] = [
        { description: 'Antibiotic Ampoules', quantity: 3, unitPrice: 19.99 }, // 59.97
        { description: 'IV Drip Sets', quantity: 2, unitPrice: 14.55 }, // 29.10
      ];

      const result = calculateInvoiceTotals(items, 5);

      expect(result.processedItems[0].amount).toBe(59.97);
      expect(result.processedItems[1].amount).toBe(29.1);
      expect(result.subtotal).toBe(89.07); // 59.97 + 29.10 = 89.07
      expect(result.tax).toBe(4.45); // 89.07 * 0.05 = 4.4535 -> 4.45
      expect(result.totalAmount).toBe(93.52); // 89.07 + 4.45 = 93.52
    });

    it('should support 0% tax for non-taxable services', () => {
      const items: LineItemInput[] = [
        { description: 'Charity Health Camp Checkup', quantity: 1, unitPrice: 100.0 },
      ];

      const result = calculateInvoiceTotals(items, 0);

      expect(result.subtotal).toBe(100.0);
      expect(result.tax).toBe(0.0);
      expect(result.totalAmount).toBe(100.0);
    });
  });

  describe('Payment Settlement & Balance Tracking', () => {
    it('should update status from UNPAID to PARTIALLY_PAID on partial payment', () => {
      const total = 500.0;
      const initialPaid = 0;
      const payment = 200.0;

      const result = processPaymentMath(initialPaid, total, payment, 'UNPAID');

      expect(result.newPaidAmount).toBe(200.0);
      expect(result.newStatus).toBe('PARTIALLY_PAID');
      expect(result.remainingBalance).toBe(300.0);
    });

    it('should update status from PARTIALLY_PAID to PAID when final balance is settled', () => {
      const total = 500.0;
      const currentPaid = 200.0;
      const payment = 300.0;

      const result = processPaymentMath(currentPaid, total, payment, 'PARTIALLY_PAID');

      expect(result.newPaidAmount).toBe(500.0);
      expect(result.newStatus).toBe('PAID');
      expect(result.remainingBalance).toBe(0.0);
    });

    it('should update status from UNPAID directly to PAID on full lump-sum payment', () => {
      const total = 577.5;
      const initialPaid = 0;
      const payment = 577.5;

      const result = processPaymentMath(initialPaid, total, payment, 'UNPAID');

      expect(result.newPaidAmount).toBe(577.5);
      expect(result.newStatus).toBe('PAID');
      expect(result.remainingBalance).toBe(0.0);
    });

    it('should reject payment exceeding outstanding balance', () => {
      const total = 100.0;
      const currentPaid = 50.0;
      const overpayment = 60.0; // outstanding is 50.0

      expect(() => {
        processPaymentMath(currentPaid, total, overpayment, 'PARTIALLY_PAID');
      }).toThrow(/exceeds outstanding balance/);
    });

    it('should reject duplicate payment attempt on already settled bill', () => {
      const total = 100.0;
      const currentPaid = 100.0;

      expect(() => {
        processPaymentMath(currentPaid, total, 50.0, 'PAID');
      }).toThrow(/already been fully settled/);
    });
  });
});
