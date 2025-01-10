import { useState } from 'react';
import { TextField, Button, Paper, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: '',
      general: ''
    }));
  };

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      general: ''
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await login({
        email: formData.email,
        password: formData.password
      });
      if (response) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors(prev => ({
        ...prev,
        general: err.message || 'Login failed'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center bg-gray-100 px-4"
    >
      <Paper className="p-8 max-w-md w-full relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <LoadingSpinner />
          </div>
        )}
        
        <Typography variant="h4" className="text-center mb-6">
          Login
        </Typography>

        {errors.general && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            required
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={isLoading}
            className="relative"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner size={20} className="mr-2" />
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Register here
            </Link>
          </Typography>
        </div>
      </Paper>
    </motion.div>
  );
}

export default Login; 