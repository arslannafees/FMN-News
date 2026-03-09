import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NewsProvider } from '@/context/NewsContext';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { ArticleDetail } from '@/pages/ArticleDetail';
import { Category } from '@/pages/Category';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { ArticleEditor } from '@/pages/ArticleEditor';
import { Subscribe } from '@/pages/Subscribe';
import { Search } from '@/pages/Search';
import { Login } from '@/pages/Login';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Market } from '@/pages/Market';
import NotFound from '@/pages/NotFound';
import './App.css';

function App() {
  return (
    <NewsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/article/:id" element={<Layout><ArticleDetail /></Layout>} />
          <Route path="/category/:category" element={<Layout><Category /></Layout>} />
          <Route path="/search" element={<Layout><Search /></Layout>} />
          <Route path="/market" element={<Layout><Market /></Layout>} />
          <Route path="/subscribe" element={<Layout><Subscribe /></Layout>} />
          <Route path="/admin/login" element={<Layout><Login /></Layout>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
            <Route path="/admin/create" element={<Layout><ArticleEditor /></Layout>} />
            <Route path="/admin/edit/:id" element={<Layout><ArticleEditor /></Layout>} />
          </Route>
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </NewsProvider>
  );
}

export default App;
