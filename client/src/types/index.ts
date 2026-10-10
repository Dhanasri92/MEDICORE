export type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  patientId?: string;
  doctorId?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  color: string;
  _count?: { doctors: number };
}

export interface Doctor {
  id: string;
  userId: string;
  departmentId: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  biography?: string;
  roomNumber?: string;
  isAvailable: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    isActive: boolean;
  };
  department: Department;
  schedules?: DoctorSchedule[];
}

export interface Patient {
  id: string;
  userId: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    createdAt?: string;
  };
  _count?: {
    appointments: number;
    medicalRecords: number;
    prescriptions: number;
    bills: number;
  };
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reasonForVisit: string;
  cancellationReason?: string;
  createdAt: string;
  patient: Patient;
  doctor: Doctor;
  medicalRecord?: MedicalRecord;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  recordId: string;
  patientId: string;
  doctorId: string;
  prescribedDate: string;
  notes?: string;
  status: string;
  items: PrescriptionItem[];
  doctor: Doctor;
  patient: Patient;
  medicalRecord?: { diagnosis: string; createdAt: string };
}

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  symptoms: string;
  physicalExamination?: string;
  treatmentPlan?: string;
  createdAt: string;
  prescription?: Prescription;
  doctor: Doctor;
  patient: Patient;
  appointment: Appointment;
}

export interface LabReport {
  id: string;
  patientId: string;
  doctorId?: string;
  testName: string;
  category: string;
  testDate: string;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED';
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  summary?: string;
  patient: Patient;
  doctor?: Doctor;
}

export interface BillItem {
  id: string;
  billId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  billId: string;
  transactionRef: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  notes?: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  patientId: string;
  appointmentId?: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  dueDate: string;
  createdAt: string;
  patient: Patient;
  items: BillItem[];
  payments: Payment[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface HospitalNotice {
  id: string;
  title: string;
  content: string;
  type: 'GENERAL' | 'MAINTENANCE' | 'HOLIDAY' | 'EMERGENCY';
  reporter?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}
