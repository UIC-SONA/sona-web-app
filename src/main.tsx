import {createRoot} from 'react-dom/client'
import {
  BrowserRouter,
  Route,
  Routes
} from "react-router";
import './index.css'
import AuthProvider from "@/context/auth-context.tsx";
import ThemeContext from "@/context/theme-context.tsx";
import MainLayout from "@/layout/main-layout.tsx";
import {AlertDialogProvider} from "@/context/alert-dialog-context.tsx";
import {Toaster} from "@/components/ui/toaster.tsx";
import AuthGuard from "@/guards/auth-guard.tsx";
import Dashboard from "@/routes/dashboard.tsx";
import UserPage from "@/routes/users/index.page.tsx";
import TipsPage from "@/routes/tips/tips.page.tsx";
import PostPage from "@/routes/posts/index.page.tsx";
import DidacticContentPage from "@/routes/didactic-content/index.page.tsx";
import ProfessionalSchedulePage from "@/routes/professionals/schedule.page.tsx";
import ProfessionalPage from "@/routes/professionals/index.page.tsx";
import {AppointmentPage} from "@/routes/appoinments/index.page.tsx";
import AppointmentsCalendarPage from "@/routes/appoinments/calendar.page.tsx";
import ChatPage from "@/routes/chat/index.page.tsx";
import AuthPage from "@/routes/auth/index.page.tsx";
import LogIn from "@/routes/auth/log-in.page.tsx";
import SingUp from "@/routes/auth/sing-up.page.tsx";
import {userService} from "@/services/user-service.ts";
import CommentsPage from "@/routes/posts/comments.page.tsx";


createRoot(document.getElementById('root')!).render(
  <ThemeContext defaultTheme="dark" storageKey="sona-ui-theme">
    <AlertDialogProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes/>
        </BrowserRouter>
      </AuthProvider>
      <Toaster/>
    </AlertDialogProvider>
  </ThemeContext>
);

function AppRoutes() {
  return <Routes>
    <Route element={<AuthGuard hasAuthenticated redirect="/auth/login"/>}>
      <Route element={<MainLayout/>}>
        <Route index element={<Dashboard/>}/>
        <Route element={<AuthGuard hasAuthorized={userService.hasPrivilegedUser} redirect="/"/>}>
          <Route path="users" element={<UserPage/>}/>
          <Route path="tips" element={<TipsPage/>}/>
          <Route path="posts" element={<PostPage/>}/>
          <Route path="posts/:postId/comments" element={<CommentsPage/>}/>
          <Route path="didactic-content" element={<DidacticContentPage/>}/>
          <Route path="professional-schedules" element={<ProfessionalSchedulePage/>}/>
          <Route path="professionals" element={<ProfessionalPage/>}/>
        </Route>
        <Route path="appointments" element={<AppointmentPage/>}/>
        <Route path="appointments-calendar" element={<AppointmentsCalendarPage/>}/>
      </Route>
      <Route path="chat/:id?" element={<ChatPage/>}/>
    </Route>
    <Route element={<AuthGuard redirect="/"/>}>
      <Route path="auth" element={<AuthPage/>}>
        <Route path="login" element={<LogIn/>}/>
        <Route path="sign-up" element={<SingUp/>}/>
      </Route>
    </Route>
  </Routes>
}