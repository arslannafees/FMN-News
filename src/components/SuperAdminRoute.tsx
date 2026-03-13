import { Navigate, Outlet } from 'react-router-dom';
import { useNews } from '@/context/NewsContextCore';

export function SuperAdminRoute() {
    const { isSuperAdmin } = useNews();

    if (!isSuperAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
}
