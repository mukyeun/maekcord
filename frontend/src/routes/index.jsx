import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import NotFound from './NotFound';
import PatientDataTable from '../components/PatientDataTable';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/patient-data" element={<PatientDataTable />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes; 