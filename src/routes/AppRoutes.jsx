import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../pages/LandingPage.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import SignupPage from "../pages/auth/SignupPage.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage.jsx";
import OtpVerifyPage from "../pages/auth/OtpVerifyPage.jsx";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage.jsx";

import DashboardLayout from "../layouts/DashboardLayout.jsx";
import CandidateDashboard from "../pages/dashboard/CandidateDashboard.jsx";
import AssessmentList from "../pages/assessment/AssessmentList.jsx";
import AssessmentInstructions from "../pages/assessment/AssessmentInstructions.jsx";
import AssessmentInterface from "../pages/assessment/AssessmentInterface.jsx";
import AssessmentResult from "../pages/assessment/AssessmentResult.jsx";
import AssessmentKey from "../pages/assessment/AssessmentKey.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

import { ROUTES } from "../constants/index.js";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LANDING} element={<LandingPage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.VERIFY_OTP} element={<OtpVerifyPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      {/* Candidate area */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<CandidateDashboard />} />
        <Route path={ROUTES.ASSESSMENTS} element={<AssessmentList />} />
        <Route
          path={ROUTES.ASSESSMENT_INSTRUCTIONS}
          element={<AssessmentInstructions />}
        />
        <Route path={ROUTES.RESULTS} element={<AssessmentResult />} />
        <Route path={ROUTES.ANSWER_KEY} element={<AssessmentKey />} />
      </Route>

      {/* Fullscreen assessment */}
      <Route
        path={ROUTES.ASSESSMENT_ATTEMPT}
        element={
          <ProtectedRoute>
            <AssessmentInterface />
          </ProtectedRoute>
        }
      />

      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  );
}
