import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./Auth";
import SignOn from "./pages/SignOn";
import Home from "./pages/Home.jsx";
import Workouts from "./pages/Workouts.jsx";
import Crew from "./pages/Crew.jsx";

function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) {
    return null;
  }
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/signin" element={<SignOn />} />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/workouts"
            element={
              <RequireAuth>
                <Workouts />
              </RequireAuth>
            }
          />
          <Route
            path="/crew"
            element={
              <RequireAuth>
                <Crew />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
