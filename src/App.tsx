import { Routes, Route } from 'react-router-dom'

import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { ProductListing } from '@/pages/ProductListing'
import { ProductDetail } from '@/pages/ProductDetail'
import { Cart } from '@/pages/Cart'
import { Account } from '@/pages/Account'
import { NotFound } from '@/pages/NotFound'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<ProductListing />} />
        <Route path="products/:handle" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
