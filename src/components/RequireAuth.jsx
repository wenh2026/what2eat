import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

const RequireAuth = ({ children }) => {
  const user = useUserStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/profile" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default RequireAuth;
