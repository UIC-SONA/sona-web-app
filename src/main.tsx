import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from "react-router";
import './index.css'
import App from './app.tsx'
import AuthPage from "@/pages/auth.page.tsx";
import LoginForm from "@/components/login-form.tsx";
import AuthProvider from "@/context/auth-context.tsx";
import ThemeContext from "@/context/theme-context.tsx";
import AuthGuard from "@/components/auth-guard.tsx";
import SingUpForm from "@/components/sing-up-form.tsx";
import MainLayout from "@/layout/main-layout.tsx";
import UsersPage from "@/pages/users.page.tsx";
import TipsPage from "@/pages/tips.page.tsx";
import {DialogProvider} from "@/context/dialog-context.tsx";


createRoot(document.getElementById('root')!).render(
  <ThemeContext defaultTheme="dark" storageKey="sona-ui-theme">
    <DialogProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthGuard/>}>
              <Route element={<MainLayout/>}>
                <Route index element={<App/>}/>
                <Route path="users" element={<UsersPage/>}/>
                <Route path="tips" element={<TipsPage/>}/>
              </Route>
              <Route path="auth" element={<AuthPage/>}>
                <Route path="login" element={<LoginForm/>}/>
                <Route path="sign-up" element={<SingUpForm/>}/>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DialogProvider>
  </ThemeContext>
);
