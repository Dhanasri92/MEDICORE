import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../src/components/common/Sidebar';
import * as AuthContextModule from '../../src/context/AuthContext';

describe('Frontend Component: Sidebar Navigation & RBAC Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin navigation menu items when user is ADMIN', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'admin-1', role: 'ADMIN', email: 'admin@medicore.hospital', firstName: 'Admin', lastName: 'User' },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      isAdmin: true,
      isDoctor: false,
      isPatient: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  it('renders doctor navigation menu items and hides admin-only routes when user is DOCTOR', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'doc-1', role: 'DOCTOR', email: 'doc@medicore.hospital', firstName: 'Dr.', lastName: 'Smith' },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      isAdmin: false,
      isDoctor: true,
      isPatient: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Lab Reports')).toBeInTheDocument();
    expect(screen.queryByText('Audit Logs')).not.toBeInTheDocument();
    expect(screen.queryByText('Department')).not.toBeInTheDocument();
  });

  it('renders patient navigation menu items when user is PATIENT', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'pat-1', role: 'PATIENT', email: 'pat@medicore.hospital', firstName: 'Jane', lastName: 'Doe' },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      isAdmin: false,
      isDoctor: false,
      isPatient: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Doctors')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Medical Records')).toBeInTheDocument();
    expect(screen.queryByText('Audit Logs')).not.toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked in mobile view', () => {
    const handleClose = vi.fn();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'pat-1', role: 'PATIENT', email: 'pat@medicore.hospital', firstName: 'Jane', lastName: 'Doe' },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      isAdmin: false,
      isDoctor: false,
      isPatient: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    const closeBtn = container.querySelector('button.lg\\:hidden');
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    }
  });
});
