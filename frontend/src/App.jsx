import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ItemsList from "./pages/ItemsList";
import Analytics from "./pages/Analytics";
import Borrowers from "./pages/Borrowers";
import ProtectedRoute from "./auth/ProtectedRoute";
import ReturnItems from "./pages/ReturnItems";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* System User */}
      <Route
        path="/items"
        element={
          <ProtectedRoute roles={['admin', 'system']}>
            <ItemsList />
          </ProtectedRoute>
        }
      />


        {/* Admin */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute role="admin">
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/borrowers"
          element={
            <ProtectedRoute role="admin">
              <Borrowers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/return"
          element={
            <ProtectedRoute roles={['system']}>
              <ReturnItems />
            </ProtectedRoute>
          }
        />


      </Routes>
    </BrowserRouter>
  );
}
