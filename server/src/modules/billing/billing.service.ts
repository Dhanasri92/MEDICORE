import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { createNotification } from '../notifications/notification.service.js';

export async function createBill(params: {
  patientId: string;
  appointmentId?: string;
  dueDate: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  taxPercent?: number;
  actorUserId: string;
  actorRole: string;
}) {
  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    include: { user: true },
  });

  if (!patient) {
    const error: any = new Error('Patient not found.');
    error.statusCode = 404;
    throw error;
  }

  // Calculate totals on server
  let subtotal = 0;
  const processedItems = params.items.map((item) => {
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
  const taxRate = (params.taxPercent !== undefined ? params.taxPercent : 5) / 100;
  const tax = Number((subtotal * taxRate).toFixed(2));
  const totalAmount = Number((subtotal + tax).toFixed(2));

  const randomDigits = crypto.randomInt(1000, 9999);
  const billNumber = `INV-${new Date().getFullYear()}-${randomDigits}`;

  const bill = await prisma.$transaction(async (tx) => {
    return await tx.bill.create({
      data: {
        billNumber,
        patientId: params.patientId,
        appointmentId: params.appointmentId,
        subtotal,
        tax,
        totalAmount,
        paidAmount: 0,
        status: 'UNPAID',
        dueDate: new Date(params.dueDate),
        items: {
          create: processedItems,
        },
      },
      include: {
        items: true,
        patient: { include: { user: true } },
      },
    });
  });

  await logAuditEvent({
    userId: params.actorUserId,
    userRole: params.actorRole,
    action: 'CREATE_BILL',
    entity: 'Bill',
    entityId: bill.id,
    details: `Invoice ${bill.billNumber} created for $${bill.totalAmount}`,
  });

  await createNotification({
    userId: patient.userId,
    title: 'New Hospital Invoice Generated',
    message: `Invoice ${bill.billNumber} for $${bill.totalAmount.toFixed(2)} is now available.`,
    type: 'BILLING',
    linkUrl: '/patient/billing',
  });

  return bill;
}

export async function processSimulatedPayment(params: {
  billId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  actorUserId: string;
  actorRole: string;
}) {
  const bill = await prisma.bill.findUnique({
    where: { id: params.billId },
    include: {
      patient: { include: { user: true } },
      payments: true,
    },
  });

  if (!bill) {
    const error: any = new Error('Invoice not found.');
    error.statusCode = 404;
    throw error;
  }

  if (bill.status === 'PAID') {
    const error: any = new Error('This invoice has already been fully settled.');
    error.statusCode = 400;
    throw error;
  }

  const outstanding = Number((bill.totalAmount - bill.paidAmount).toFixed(2));
  if (params.amount > outstanding) {
    const error: any = new Error(
      `Payment amount ($${params.amount}) exceeds outstanding balance of $${outstanding}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const transactionRef = `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    // Re-query within transaction to prevent race conditions and duplicate payments
    const txBill = await tx.bill.findUnique({
      where: { id: params.billId },
      include: {
        patient: { include: { user: true } },
        payments: true,
      },
    });

    if (!txBill) {
      const error: any = new Error('Invoice not found.');
      error.statusCode = 404;
      throw error;
    }

    if (txBill.status === 'PAID') {
      const error: any = new Error('This invoice has already been fully settled.');
      error.statusCode = 400;
      throw error;
    }

    const txOutstanding = Number((txBill.totalAmount - txBill.paidAmount).toFixed(2));
    if (params.amount > txOutstanding) {
      const error: any = new Error(
        `Payment amount ($${params.amount}) exceeds outstanding balance of $${txOutstanding}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 1. Create payment entry
    const payment = await tx.payment.create({
      data: {
        billId: txBill.id,
        transactionRef,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        status: 'SUCCESS',
        notes: `Simulated transaction [Demo Mode] - ${params.notes || ''}`,
      },
    });

    // 2. Update bill paid amount and status
    const newPaidAmount = Number((txBill.paidAmount + params.amount).toFixed(2));
    const newStatus = newPaidAmount >= txBill.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    const updatedBill = await tx.bill.update({
      where: { id: txBill.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    return { payment, bill: updatedBill, patientUserId: txBill.patient.userId, billNumber: txBill.billNumber };
  });

  await logAuditEvent({
    userId: params.actorUserId,
    userRole: params.actorRole,
    action: 'PROCESS_PAYMENT',
    entity: 'Payment',
    entityId: result.payment.id,
    details: `Processed payment of $${params.amount} (${params.paymentMethod}) for ${bill.billNumber}`,
  });

  await createNotification({
    userId: bill.patient.userId,
    title: 'Payment Receipt Issued',
    message: `Payment of $${params.amount.toFixed(2)} received for ${bill.billNumber}. Ref: ${transactionRef}.`,
    type: 'BILLING',
    linkUrl: '/patient/billing',
  });

  return result;
}
