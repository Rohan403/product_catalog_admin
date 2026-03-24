import { Routes, Route, Navigate } from 'react-router-dom';
import Layout             from './components/Layout/Layout';
import ProductListPage    from './pages/ProductList/ProductListPage';
import AddProductPage     from './pages/AddProduct/AddProductPage';
import EditProductPage    from './pages/AddProduct/EditProductPage';
import ProductDetailPage  from './pages/ProductDetail/ProductDetailPage';
import CategoriesPage     from './pages/Categories/CategoriesPage';
import AddCategoryPage    from './pages/Categories/AddCategoryPage';
import EditCategoryPage   from './pages/Categories/EditCategoryPage';
import SearchPage         from './pages/Search/SearchPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="products"              element={<ProductListPage />} />
        <Route path="products/add"          element={<AddProductPage />} />
        <Route path="products/:id/edit"     element={<EditProductPage />} />
        <Route path="products/:id"          element={<ProductDetailPage />} />
        <Route path="categories"            element={<CategoriesPage />} />
        <Route path="categories/add"        element={<AddCategoryPage />} />
        <Route path="categories/:id/edit"   element={<EditCategoryPage />} />
        <Route path="search"                element={<SearchPage />} />
        <Route path="*"                     element={<Navigate to="/products" replace />} />
      </Route>
    </Routes>
  );
}
