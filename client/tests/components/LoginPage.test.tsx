import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../src/pages/public/LoginPage';
import * as AuthContextModule from '../../src/context/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Frontend Page: LoginPage', () => {
  let mockLogin: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin = vi.fn();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('renders login form and demo credential buttons', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Sign in to your hospital account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@medicore.hospital')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText(/Dr. Robert Fox \(Admin\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Gregory House \(Doctor\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Alex Morgan \(Patient\)/i)).toBeInTheDocument();
  });

  it('populates fields when a demo portal button is clicked', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const doctorDemoBtn = screen.getByText(/Dr. Gregory House \(Doctor\)/i).closest('button')!;
    fireEvent.click(doctorDemoBtn);

    const emailInput = screen.getByPlaceholderText('name@medicore.hospital') as HTMLInputElement;
    expect(emailInput.value).toBe('dr.gregory@medicore.hospital');
  });

  it('submits credentials and navigates to doctor dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce({
      id: 'doc-1',
      role: 'DOCTOR',
      email: 'dr.gregory@medicore.hospital',
      firstName: 'Gregory',
      lastName: 'House',
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('name@medicore.hospital'), {
      target: { value: 'dr.gregory@medicore.hospital' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Doctor@123' },
    });

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('dr.gregory@medicore.hospital', 'Doctor@123');
      expect(mockNavigate).toHaveBeenCalledWith('/doctor/dashboard');
    });
  });

  it('displays error message banner when authentication fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('name@medicore.hospital'), {
      target: { value: 'invalid@user.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'WrongPassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
