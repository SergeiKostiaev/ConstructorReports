import './App.sass';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthForm from './components/AuthForm/AuthForm.jsx';
import Home from "./components/Home/Home.jsx";
import {ToastContainer} from "react-toastify";
import {useEffect} from "react";
import "./index.sass";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};


function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<AuthForm isRegister={false} />} />
                    <Route path="/register" element={<AuthForm isRegister={true} />} />
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
                <ToastContainer />
            </AuthProvider>
        </Router>
    );
}

export default App;
