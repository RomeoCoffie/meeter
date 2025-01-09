import { useState } from 'react';
import { TextField, Button, Paper, Typography, Link, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validateName } from '../utils/validation';
import LoadingSpinner from '../components/LoadingSpinner';
import authService from '../services/auth.service';
import { motion } from 'framer-motion';

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'freelancer',
    fullName: ''
  });
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear specific field error when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: '',
      general: ''
    }));
  };

  const validateForm = () => {
    const newErrors = {
      fullName: validateName(formData.fullName),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: '',
      general: ''
    };

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        userType: formData.userType
      });
      login(response.user);
      navigate('/dashboard');
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        general: err.message
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
          Register
        </Typography>

        {errors.general && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={!!errors.fullName}
            helperText={errors.fullName}
            required
            disabled={isLoading}
          />

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

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            required
            disabled={isLoading}
          />

          <RadioGroup
            row
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            className="justify-center"
          >
            <FormControlLabel 
              value="freelancer" 
              control={<Radio />} 
              label="Freelancer" 
            />
            <FormControlLabel 
              value="client" 
              control={<Radio />} 
              label="Client" 
            />
          </RadioGroup>

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
                Registering...
              </span>
            ) : (
              'Register'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Typography variant="body2">
            Already have an account?{' '}
            <Link
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Login here
            </Link>
          </Typography>
        </div>
      </Paper>
    </motion.div>
  );
}

export default Register; 