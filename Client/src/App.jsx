import { Navigate, Route, Routes } from "react-router-dom";
import { auth } from "./api/http.js";
import NavBar from "./component/NavBar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Pages from "./pages/pages.jsx";
import ReviewQueue from "./pages/ReviewQueue.jsx";
import Composer from "./pages/Composer.jsx";
import Posts from "./pages/Posts.jsx";

import Agent from "./pages/Agent.jsx";

function Protected({ children }) {
  if (!auth.get()) return <Navigate to="/login" replace />;
  return (
    <>
      <NavBar />
      <div className="container py-4">{children}</div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/pages"
        element={
          <Protected>
            <Pages />
          </Protected>
        }
      />
      <Route
        path="/review"
        element={
          <Protected>
            <ReviewQueue />
          </Protected>
        }
      />
      <Route
        path="/compose"
        element={
          <Protected>
            <Composer />
          </Protected>
        }
      />

      <Route
        path="/agent"
        element={
          <Protected>
            <Agent />
          </Protected>
        }
      />

      <Route
        path="/posts"
        element={
          <Protected>
            <Posts />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
