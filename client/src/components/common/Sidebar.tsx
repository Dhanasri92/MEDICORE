import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Building2,
  Calendar,
  FileText,
  CreditCard,
  Microscope,
  Bell,
  Settings,
  ShieldCheck,
  Plus,
  FolderPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickAction?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onQuickAction }) => {
  const { user, isAdmin, isDoctor, isPatient } = useAuth();
  const navigate = useNavigate();

  // Navigation items structured according to the MediKit screenshot
  let navItems: Array<{
    label: string;
    path: string;
    icon: React.ElementType;
    badge?: string;
  }> = [];

  if (isAdmin) {
    navItems = [
      { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Doctor', path: '/admin/doctors', icon: Stethoscope },
      { label: 'Patient', path: '/admin/patients', icon: Users },
      { label: 'Department', path: '/admin/departments', icon: Building2 },
      { label: 'Appointment', path: '/admin/appointments', icon: Calendar },
      { label: 'Payment', path: '/admin/billing', icon: CreditCard },
      { label: 'Report', path: '/admin/lab-reports', icon: Microscope },
      { label: 'Notice', path: '/admin/notices', icon: Bell },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
    ];
  } else if (isDoctor) {
    navItems = [
      { label: 'Overview', path: '/doctor/dashboard', icon: LayoutDashboard },
      { label: 'Appointment', path: '/doctor/appointments', icon: Calendar },
      { label: 'Patient', path: '/doctor/patients', icon: Users },
      { label: 'Prescriptions', path: '/doctor/prescriptions', icon: FileText },
      { label: 'Lab Reports', path: '/doctor/lab-reports', icon: Microscope },
    ];
  } else {
    // Patient
    navItems = [
      { label: 'Overview', path: '/patient/dashboard', icon: LayoutDashboard },
      { label: 'Doctors', path: '/patient/doctors', icon: Stethoscope },
      { label: 'Appointments', path: '/patient/appointments', icon: Calendar },
      { label: 'Medical Records', path: '/patient/medical-records', icon: FileText },
      { label: 'Prescriptions', path: '/patient/prescriptions', icon: FileText },
      { label: 'Lab Reports', path: '/patient/lab-reports', icon: Microscope },
      { label: 'Payment', path: '/patient/billing', icon: CreditCard },
      { label: 'Profile', path: '/patient/profile', icon: Settings },
    ];
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-[#E9EDF2] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Logo and Navigation */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#329BFA] flex items-center justify-center text-white shadow-sm shadow-[#329BFA]/30">
                {/* Medical pill / cross icon */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7v-2h4V7h2v4h4v2h-4v4z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#171B22]">
                MediCore
              </span>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-[#9298A1] hover:text-[#171B22] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#329BFA] text-white shadow-sm shadow-[#329BFA]/30'
                        : 'text-[#9298A1] hover:text-[#171B22] hover:bg-[#F5F6F8]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card matching MediKit "+ Create New" / "Add New Category" */}
        <div className="p-5 border-t border-[#F2F5F8]">
          <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E9EDF2] text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[#EBF5FE] flex items-center justify-center text-[#329BFA]">
              <FolderPlus className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#171B22] mb-1">
              {isPatient ? 'Book an Appointment' : 'Add New Category or Database'}
            </p>
            <p className="text-[11px] text-[#9298A1] mb-3">
              {isPatient ? 'Schedule a visit with any doctor' : 'Expand hospital operational schemas'}
            </p>
            <button
              onClick={() => {
                if (onQuickAction) {
                  onQuickAction();
                } else if (isPatient) {
                  navigate('/patient/doctors');
                } else if (isAdmin) {
                  navigate('/admin/doctors');
                }
              }}
              className="w-full py-2 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isPatient ? 'Book Now' : '+ Create New'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
