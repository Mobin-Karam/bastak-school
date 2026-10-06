import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegistrationDashboardPage } from "./RegistrationDashboardPage";
import { RegistrationLayout } from "./RegistrationLayout";
import { MemoryRouter } from "react-router-dom";

// Mock API calls
jest.mock("./api/registration.api", () => ({
  getRegistrationSelf: jest.fn(),
  updateRegistrationProfile: jest.fn(),
  uploadStudentDocument: jest.fn(),
  completeRegistration: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Registration Dashboard Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    // Mock the API to return a loading state
    (require('./api/registration.api').getRegistrationSelf as jest.Mock).mockReturnValue(
      Promise.resolve({
        student: {},
        documents: [],
        status: 'DRAFT',
        progress: 0,
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RegistrationLayout>
            <RegistrationDashboardPage />
          </RegistrationLayout>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders registration dashboard with sections', async () => {
    // Mock the API to return sample data
    (require('./api/registration.api').getRegistrationSelf as jest.Mock).mockReturnValue(
      Promise.resolve({
        student: {
          id: '123',
          name: 'علی اصغری',
          nationalCode: '1234567890',
          registrationStatus: 'IN_PROGRESS',
          organization: { id: '1', name: 'مدرسه نمونه' },
        },
        profile: {
          nationalCode: '1234567890',
          shenasnameNumber: '123456789',
          birthDate: '2005-01-01',
          mobileNumber: '09123456789',
        },
        documents: [
          { id: '1', type: 'SHENASNAME', originalFileName: 'shenasname.jpg', status: 'SUBMITTED', uploadedAt: '2024-01-01' },
        ],
        status: 'IN_PROGRESS',
        progress: 50,
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RegistrationLayout>
            <RegistrationDashboardPage />
          </RegistrationLayout>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('پنل ثبت‌نام دانش‌آموزان')).toBeInTheDocument();
      expect(screen.getByText('اطلاعات اولیه')).toBeInTheDocument();
      expect(screen.getByText('مدارک')).toBeInTheDocument();
      expect(screen.getByText('تکمیل ثبت‌نام')).toBeInTheDocument();
    });
  });

  it('shows correct status badge', async () => {
    (require('./api/registration.api').getRegistrationSelf as jest.Mock).mockReturnValue(
      Promise.resolve({
        student: {},
        profile: {},
        documents: [],
        status: 'COMPLETED',
        progress: 100,
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RegistrationLayout>
            <RegistrationDashboardPage />
          </RegistrationLayout>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('تکمیل شده')).toBeInTheDocument();
    });
  });
});