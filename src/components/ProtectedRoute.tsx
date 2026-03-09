import { Navigate, Outlet } from 'react-router-dom';
import { useNews } from '@/context/NewsContextCore';

export function ProtectedRoute() {
    const { isAdmin } = useNews();

    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
}
