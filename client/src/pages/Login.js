import { useState } from 'react';
import { TextField, Button, Paper, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: 'rom@romeo.com',
    password: 'Letmein21..'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Paper className="max-w-md w-full space-y-8 p-6">
        <div>
          <Typography variant="h4" align="center" gutterBottom>
            Sign In
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary">
            Use the pre-filled credentials or enter your own
          </Typography>
        </div>

        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center mt-4">
            <Link to="/register" className="text-blue-600 hover:text-blue-800">
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </Paper>
    </div>
  );
}

export default Login; 