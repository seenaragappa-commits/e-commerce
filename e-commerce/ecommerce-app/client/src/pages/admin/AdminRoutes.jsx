import { Link, Route, Routes } from 'react-router';
import { Compass } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import EmptyState from '../../components/EmptyState';
import PageTitle from '../../components/PageTitle';
import AdminDashboardPage from './AdminDashboardPage';
import AdminProductsPage from './AdminProductsPage';
import AdminProductFormPage from './AdminProductFormPage';
import AdminOrdersPage from './AdminOrdersPage';
import AdminOrderDetailsPage from './AdminOrderDetailsPage';
import AdminUsersPage from './AdminUsersPage';
import AdminProfilePage from './AdminProfilePage';

function AdminNotFound() {
  return (
    <>
      <PageTitle title="Page not found" />
      <EmptyState
        icon={Compass}
        title="Page not found"
        message="This admin page does not exist."
        action={
          <Link to="/admin" className="btn btn-primary">
            Go to dashboard
          </Link>
        }
      />
    </>
  );
}

/**
 * All admin pages. App.jsx loads this file lazily (customers never download the
 * admin code) and only for users whose role is "admin". Paths are relative to /admin.
 */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductFormPage />} />
        <Route path="products/edit/:id" element={<AdminProductFormPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="*" element={<AdminNotFound />} />
      </Route>
    </Routes>
  );
}
