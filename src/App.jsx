import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from './pages/Login';
import Layout from './components/Layout';
import RoleRouter from './pages/RoleRouter';
import AdminDashboard from './pages/AdminDashboard';
import AdminPaymentApprovals from './pages/AdminPaymentApprovals';
import AdminClientPayments from './pages/AdminClientPayments';
import AdminProjects from './pages/AdminProjects';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';
import AdminTickets from './pages/AdminTickets';
import QuoteBuilder from './pages/QuoteBuilder';
import QuoteView from './pages/QuoteView';
import AdminClients from './pages/AdminClients';
import TeamMemberProfile from './pages/TeamMemberProfile';
import PMProjects from './pages/PMProjects';
import PMProjectDetail from './pages/PMProjectDetail';
import PMTickets from './pages/PMTickets';
import PMPaymentRequests from './pages/PMPaymentRequests';
import PMTeam from './pages/PMTeam';
import ProTasks from './pages/ProTasks';
import ProProjects from './pages/ProProjects';
import ProPayments from './pages/ProPayments';
import ClientProjects from './pages/ClientProjects';
import ClientApprovals from './pages/ClientApprovals';
import ClientTickets from './pages/ClientTickets';
import ClientPayments from './pages/ClientPayments';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public quote viewer — no auth, no sidebar */}
      <Route path="/quote/:token" element={<QuoteView />} />

      <Route element={<Layout />}>
        <Route path="/" element={<RoleRouter />} />
        <Route path="/admin/approvals" element={<AdminPaymentApprovals />} />
        <Route path="/admin/payments" element={<AdminClientPayments />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/projects/:id" element={<PMProjectDetail />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/tickets" element={<AdminTickets />} />
        <Route path="/admin/team" element={<PMTeam />} />
        <Route path="/admin/team/:id" element={<TeamMemberProfile />} />
        <Route path="/admin/quotes" element={<QuoteBuilder />} />
        <Route path="/admin/clients" element={<AdminClients />} />
        <Route path="/pm/projects" element={<PMProjects />} />
        <Route path="/pm/projects/:id" element={<PMProjectDetail />} />
        <Route path="/pm/tickets" element={<AdminTickets />} />
        <Route path="/pm/quotes" element={<QuoteBuilder />} />
        <Route path="/pm/clients" element={<AdminClients />} />
        <Route path="/pm/payments" element={<PMPaymentRequests />} />
        <Route path="/pm/team" element={<PMTeam />} />
        <Route path="/pm/team/:id" element={<TeamMemberProfile />} />
        <Route path="/pro/tasks" element={<ProTasks />} />
        <Route path="/pro/projects" element={<ProProjects />} />
        <Route path="/pro/projects/:id" element={<PMProjectDetail />} />
        <Route path="/pro/payments" element={<ProPayments />} />
        <Route path="/client/projects" element={<ClientProjects />} />
        <Route path="/client/approvals" element={<ClientApprovals />} />
        <Route path="/client/tickets" element={<ClientTickets />} />
        <Route path="/client/payments" element={<ClientPayments />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <AuthProvider>
              <AuthenticatedApp />
            </AuthProvider>
          } />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App