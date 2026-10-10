import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting MediCore database seeding...');

  // Clean existing records in relational order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.labReport.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.hospitalNotice.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  console.log('[SEED] Cleaned database.');

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  const patientPassword = await bcrypt.hash('Patient@123', 10);

  // 1. Create Admin User (Dr. Robert Fox - Admin from MediKit screenshot)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@medicore.hospital',
      passwordHash: adminPassword,
      role: 'ADMIN',
      firstName: 'Robert',
      lastName: 'Fox',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Create Clinical Departments
  const departmentsData = [
    { name: 'Cardiology', code: 'CARD', description: 'Advanced cardiovascular care and echocardiology', color: '#329BFA' },
    { name: 'Gynecology', code: 'GYN', description: 'Comprehensive women health and maternity services', color: '#FF5E7E' },
    { name: 'Orthopedics', code: 'ORTH', description: 'Musculoskeletal surgery and joint reconstruction', color: '#00C2B2' },
    { name: 'Neurology', code: 'NEUR', description: 'Brain, spine, and central nervous system disorders', color: '#A855F7' },
    { name: 'General Medicine', code: 'GEN', description: 'Primary care, diagnostic evaluation, and preventive health', color: '#10B981' },
    { name: 'Pediatrics', code: 'PEDI', description: 'Newborn, infant, and adolescent medical care', color: '#F59E0B' },
  ];

  const depts: Record<string, any> = {};
  for (const dept of departmentsData) {
    depts[dept.code] = await prisma.department.create({ data: dept });
  }

  // 3. Create Doctors (Matching MediKit screenshot list: Dr. Brandon, Dr. Gregory, Dr. Robert, Dr. Calvin, Dr. Mitchell, Dr. Randall, Dr. Lee, Dr. Bernard)
  const doctorsData = [
    {
      firstName: 'Brandon',
      lastName: 'Miller',
      email: 'dr.brandon@medicore.hospital',
      deptCode: 'GYN',
      specialization: 'Gynecologist',
      qualification: 'MD, FACOG - Harvard Medical School',
      experienceYears: 12,
      fee: 120.0,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
      room: 'Suite 204',
    },
    {
      firstName: 'Gregory',
      lastName: 'House',
      email: 'dr.gregory@medicore.hospital',
      deptCode: 'CARD',
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD (Cardiology), FACC',
      experienceYears: 16,
      fee: 150.0,
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
      room: 'Suite 108',
    },
    {
      firstName: 'Robert',
      lastName: 'Chen',
      email: 'dr.robert@medicore.hospital',
      deptCode: 'ORTH',
      specialization: 'Orthopedicologist',
      qualification: 'MS (Ortho), FRCS',
      experienceYears: 14,
      fee: 135.0,
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
      room: 'Suite 312',
    },
    {
      firstName: 'Calvin',
      lastName: 'Klein',
      email: 'dr.calvin@medicore.hospital',
      deptCode: 'NEUR',
      specialization: 'Neurologist',
      qualification: 'MD, DM (Neurology)',
      experienceYears: 9,
      fee: 140.0,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      room: 'Suite 405',
    },
    {
      firstName: 'Mitchell',
      lastName: 'Vance',
      email: 'dr.mitchell@medicore.hospital',
      deptCode: 'GEN',
      specialization: 'General Physician',
      qualification: 'MD (Internal Medicine)',
      experienceYears: 11,
      fee: 90.0,
      avatar: 'https://images.unsplash.com/photo-1594824813589-9a05f1eb0268?w=150&auto=format&fit=crop&q=80',
      room: 'Suite 102',
    },
    {
      firstName: 'Randall',
      lastName: 'Simmons',
      email: 'dr.randall@medicore.hospital',
      deptCode: 'PEDI',
      specialization: 'Pediatrician',
      qualification: 'MD (Pediatrics)',
      experienceYears: 8,
      fee: 95.0,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      room: 'Suite 115',
    },
    {
      firstName: 'Lee',
      lastName: 'Jun-ho',
      email: 'dr.lee@medicore.hospital',
      deptCode: 'CARD',
      specialization: 'Interventional Cardiologist',
      qualification: 'MD, FESC',
      experienceYears: 15,
      fee: 160.0,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
      room: 'Suite 109',
    },
    {
      firstName: 'Bernard',
      lastName: 'Marx',
      email: 'dr.bernard@medicore.hospital',
      deptCode: 'GEN',
      specialization: 'Consultant Physician',
      qualification: 'MBBS, MD',
      experienceYears: 10,
      fee: 100.0,
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
      room: 'Suite 201',
    },
  ];

  const doctors: Record<string, any> = {};

  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        passwordHash: doctorPassword,
        role: 'DOCTOR',
        firstName: doc.firstName,
        lastName: doc.lastName,
        phone: `+1 (555) 400-${Math.floor(1000 + Math.random() * 9000)}`,
        avatar: doc.avatar,
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        departmentId: depts[doc.deptCode].id,
        specialization: doc.specialization,
        qualification: doc.qualification,
        experienceYears: doc.experienceYears,
        consultationFee: doc.fee,
        roomNumber: doc.room,
        biography: `Dr. ${doc.firstName} ${doc.lastName} is an esteemed specialist with over ${doc.experienceYears} years of exemplary clinical practice in ${doc.specialization}.`,
      },
    });

    doctors[doc.firstName.toLowerCase()] = { user, doctor };

    // Create 7-day schedule for each doctor
    for (let day = 1; day <= 6; day++) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          slotDuration: 30,
          isActive: true,
        },
      });
    }
  }

  // 4. Create Patients (Matching screenshot: Cameron, Jorge, Philip, Nathan, Soham + demo patient)
  const patientsData = [
    {
      firstName: 'Cameron',
      lastName: 'Williamson',
      email: 'cameron@example.com',
      dob: '1972-04-12', // Age 54
      gender: 'MALE',
      blood: 'O+',
      phone: '+1 (555) 601-4412',
      address: '742 Evergreen Terrace, Springfield',
      allergies: 'Penicillin',
    },
    {
      firstName: 'Jorge',
      lastName: 'Warren',
      email: 'jorge@example.com',
      dob: '1950-08-25', // Age 76
      gender: 'FEMALE',
      blood: 'A+',
      phone: '+1 (555) 602-5531',
      address: '221B Baker Street, London',
      allergies: 'Aspirin, Sulfonamides',
    },
    {
      firstName: 'Philip',
      lastName: 'Watson',
      email: 'philip@example.com',
      dob: '1979-11-03', // Age 47
      gender: 'MALE',
      blood: 'B+',
      phone: '+1 (555) 603-9982',
      address: '10 Downing St, Westminster',
      allergies: 'None',
    },
    {
      firstName: 'Nathan',
      lastName: 'Fox',
      email: 'nathan@example.com',
      dob: '1986-06-19', // Age 40
      gender: 'FEMALE',
      blood: 'AB+',
      phone: '+1 (555) 604-1123',
      address: '350 Fifth Avenue, New York, NY',
      allergies: 'Latex',
    },
    {
      firstName: 'Soham',
      lastName: 'Patel',
      email: 'soham@example.com',
      dob: '1983-02-14', // Age 43
      gender: 'FEMALE',
      blood: 'O-',
      phone: '+1 (555) 605-7764',
      address: '42 Wallaby Way, Sydney',
      allergies: 'Iodine contrast',
    },
    {
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'patient@medicore.hospital',
      dob: '1994-09-15',
      gender: 'FEMALE',
      blood: 'A-',
      phone: '+1 (555) 909-3321',
      address: '100 Medical Center Blvd, Suite 4',
      allergies: 'None',
    },
  ];

  const patients: Record<string, any> = {};

  for (const p of patientsData) {
    const user = await prisma.user.create({
      data: {
        email: p.email,
        passwordHash: patientPassword,
        role: 'PATIENT',
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
      },
    });

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        dateOfBirth: new Date(p.dob),
        gender: p.gender,
        bloodGroup: p.blood,
        address: p.address,
        allergies: p.allergies,
        emergencyContactName: 'Family Contact',
        emergencyContactPhone: p.phone,
      },
    });

    patients[p.firstName.toLowerCase()] = { user, patient };
  }

  // 5. Create Appointments matching the screenshot Online Appointment table:
  // 01: Cameron -> Dr. Lee, 6:30pm
  // 02: Jorge -> Dr. Gregory, 7:30pm
  // 03: Philip -> Dr. Bernard, 8:30pm
  // 04: Nathan -> Dr. Mitchell, 9:00pm
  // 05: Soham -> Dr. Randall, 6:30pm
  const todayStr = new Date().toISOString().split('T')[0];

  const appointmentsData = [
    {
      patient: patients.cameron,
      doctor: doctors.lee,
      date: todayStr,
      time: '18:30',
      reason: 'Routine post-operative cardiac catheterization follow-up and blood pressure check',
      status: 'CONFIRMED',
      number: 'APT-2026-0101',
    },
    {
      patient: patients.jorge,
      doctor: doctors.gregory,
      date: todayStr,
      time: '19:30',
      reason: 'Recurrent arrhythmia episodes and evaluation of Holter monitor telemetry',
      status: 'CONFIRMED',
      number: 'APT-2026-0102',
    },
    {
      patient: patients.philip,
      doctor: doctors.bernard,
      date: todayStr,
      time: '20:30',
      reason: 'Persistent seasonal allergies and chronic rhinosinusitis management',
      status: 'CONFIRMED',
      number: 'APT-2026-0103',
    },
    {
      patient: patients.nathan,
      doctor: doctors.mitchell,
      date: todayStr,
      time: '21:00',
      reason: 'Annual preventive physical exam, metabolic panel review',
      status: 'CONFIRMED',
      number: 'APT-2026-0104',
    },
    {
      patient: patients.soham,
      doctor: doctors.randall,
      date: todayStr,
      time: '18:30',
      reason: 'Consultation regarding pediatric immunology and vaccination scheduling',
      status: 'CONFIRMED',
      number: 'APT-2026-0105',
    },
  ];

  for (const appt of appointmentsData) {
    await prisma.appointment.create({
      data: {
        appointmentNumber: appt.number,
        patientId: appt.patient.patient.id,
        doctorId: appt.doctor.doctor.id,
        appointmentDate: appt.date,
        timeSlot: appt.time,
        status: appt.status,
        reasonForVisit: appt.reason,
      },
    });
  }

  // 6. Create Completed Appointment with Medical Record and Prescription for Cameron & Alex
  const completedAppt = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-0099',
      patientId: patients.alex.patient.id,
      doctorId: doctors.gregory.doctor.id,
      appointmentDate: '2026-10-08',
      timeSlot: '11:00',
      status: 'COMPLETED',
      reasonForVisit: 'Chest discomfort and shortness of breath upon exertion',
    },
  });

  const medicalRecord = await prisma.medicalRecord.create({
    data: {
      appointmentId: completedAppt.id,
      patientId: patients.alex.patient.id,
      doctorId: doctors.gregory.doctor.id,
      diagnosis: 'Mild Essential Hypertension with Sinus Tachycardia',
      symptoms: 'Intermittent palpitations, mild cephalalgia, resting BP 142/92 mmHg',
      physicalExamination: 'Cardiovascular: Normal S1/S2, no murmurs. Lungs: Clear to auscultation bilaterally.',
      treatmentPlan: 'Initiate low-dose beta blocker, dietary sodium restriction, follow up in 4 weeks.',
    },
  });

  const prescription = await prisma.prescription.create({
    data: {
      recordId: medicalRecord.id,
      patientId: patients.alex.patient.id,
      doctorId: doctors.gregory.doctor.id,
      notes: 'Take medication daily morning after breakfast. Monitor resting heart rate.',
      status: 'ACTIVE',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescription.id,
        medicineName: 'Metoprolol Succinate ER',
        dosage: '25 mg',
        frequency: 'Once daily in the morning',
        duration: '30 Days',
        instructions: 'Do not crush or chew. Take with full glass of water.',
      },
      {
        prescriptionId: prescription.id,
        medicineName: 'Aspirin Low Dose',
        dosage: '81 mg',
        frequency: 'Once daily with dinner',
        duration: '30 Days',
        instructions: 'Take after food to avoid stomach irritation.',
      },
    ],
  });

  // 7. Create Itemized Invoices & Payments
  const bill1 = await prisma.bill.create({
    data: {
      billNumber: 'INV-2026-1001',
      patientId: patients.alex.patient.id,
      appointmentId: completedAppt.id,
      subtotal: 210.0,
      tax: 10.5,
      totalAmount: 220.5,
      paidAmount: 220.5,
      status: 'PAID',
      dueDate: new Date('2026-11-01'),
      items: {
        create: [
          { description: 'Specialist Consultation Fee (Dr. Gregory House)', quantity: 1, unitPrice: 150.0, amount: 150.0 },
          { description: '12-Lead Electrocardiogram (ECG)', quantity: 1, unitPrice: 60.0, amount: 60.0 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      billId: bill1.id,
      transactionRef: 'TXN-88219401',
      amount: 220.5,
      paymentMethod: 'CREDIT_CARD',
      status: 'SUCCESS',
      notes: 'Settled in full via Visa debit card [Simulated Demo]',
    },
  });

  // Unpaid bill for Cameron
  await prisma.bill.create({
    data: {
      billNumber: 'INV-2026-1002',
      patientId: patients.cameron.patient.id,
      subtotal: 180.0,
      tax: 9.0,
      totalAmount: 189.0,
      paidAmount: 0.0,
      status: 'UNPAID',
      dueDate: new Date('2026-10-30'),
      items: {
        create: [
          { description: 'Cardiac Follow-up Assessment', quantity: 1, unitPrice: 120.0, amount: 120.0 },
          { description: 'Diagnostic Comprehensive Metabolic Panel (CMP)', quantity: 1, unitPrice: 60.0, amount: 60.0 },
        ],
      },
    },
  });

  // 8. Create Diagnostic Lab Reports
  await prisma.labReport.createMany({
    data: [
      {
        patientId: patients.alex.patient.id,
        doctorId: doctors.gregory.doctor.id,
        testName: 'Complete Blood Count (CBC) with Differential',
        category: 'Hematology',
        testDate: new Date('2026-10-08'),
        status: 'COMPLETED',
        summary: 'Hemoglobin 14.2 g/dL, Platelets 260K/uL, WBC 6.8K/uL. All parameters within normal reference ranges.',
        fileName: 'CBC_Report_Alex_Morgan.pdf',
        mimeType: 'application/pdf',
        fileSize: 245000,
      },
      {
        patientId: patients.cameron.patient.id,
        doctorId: doctors.lee.doctor.id,
        testName: 'Lipid Profile & Serum Cholesterol',
        category: 'Biochemistry',
        testDate: new Date('2026-10-09'),
        status: 'COMPLETED',
        summary: 'Total Cholesterol 185 mg/dL, HDL 52 mg/dL, LDL 108 mg/dL, Triglycerides 125 mg/dL. Normal profile.',
        fileName: 'Lipid_Panel_Cameron.pdf',
        mimeType: 'application/pdf',
        fileSize: 182000,
      },
    ],
  });

  // 9. Create Hospital Notices matching MediKit screenshot:
  // "Room 501 AC is not working" (Reported by Steve)
  // "Daniel extended his holiday" (Reported by Androw)
  // "101 washroom needed to clean" (Reported by Steve)
  await prisma.hospitalNotice.createMany({
    data: [
      {
        title: 'Room 501 AC is not working',
        content: 'HVAC technician requested for emergency inspection in Room 501 inpatient wing.',
        type: 'MAINTENANCE',
        reporter: 'Steve',
        priority: 'HIGH',
      },
      {
        title: 'Daniel extended his holiday',
        content: 'Physiotherapy department shift reassigned to cover extended personal leave until Oct 24.',
        type: 'HOLIDAY',
        reporter: 'Androw',
        priority: 'NORMAL',
      },
      {
        title: '101 washroom needed to clean',
        content: 'Sanitation dispatched to ground floor diagnostic wing washroom.',
        type: 'MAINTENANCE',
        reporter: 'Steve',
        priority: 'NORMAL',
      },
      {
        title: 'Quarterly Staff Clinical Protocol Meeting',
        content: 'All resident physicians and nursing leads to gather in Conference Hall B on Friday at 3:00 PM.',
        type: 'GENERAL',
        reporter: 'Dr. Robert Fox',
        priority: 'HIGH',
      },
    ],
  });

  // 10. Create In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'System Initialized',
        message: 'MediCore Online Hospital Management System is fully operational.',
        type: 'SYSTEM',
        linkUrl: '/admin/dashboard',
      },
      {
        userId: patients.alex.user.id,
        title: 'Prescription Available',
        message: 'Dr. Gregory House has issued your medication regimen.',
        type: 'PRESCRIPTION',
        linkUrl: '/patient/prescriptions',
      },
      {
        userId: patients.alex.user.id,
        title: 'Lab Report Ready',
        message: 'Your Complete Blood Count (CBC) test results are certified.',
        type: 'LAB_REPORT',
        linkUrl: '/patient/lab-reports',
      },
    ],
  });

  // 11. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        userRole: 'ADMIN',
        action: 'SEED_SYSTEM',
        entity: 'System',
        details: 'Initial hospital operational data and clinical accounts seeded successfully.',
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('[SEED] MediCore database successfully populated with rich demo data!');
  console.log('================================================================');
  console.log('  DEMO CREDENTIALS:');
  console.log('  Admin:   admin@medicore.hospital   | Password: Admin@123');
  console.log('  Doctor:  dr.gregory@medicore.hospital | Password: Doctor@123');
  console.log('  Doctor:  dr.brandon@medicore.hospital | Password: Doctor@123');
  console.log('  Patient: patient@medicore.hospital | Password: Patient@123');
  console.log('  Patient: cameron@example.com       | Password: Patient@123');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('[SEED_ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
