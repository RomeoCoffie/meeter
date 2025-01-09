import { CircularProgress } from '@mui/material';

function LoadingSpinner({ size = 24, className = '' }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <CircularProgress size={size} />
    </div>
  );
}

export default LoadingSpinner; 