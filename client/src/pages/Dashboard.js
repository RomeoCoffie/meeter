import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import UserProfile from '../components/UserProfile';
import Calendar from '../components/Calendar';
import ScheduleMeeting from '../components/ScheduleMeeting';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const [value, setValue] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleChange = (event, newValue) => {
    setValue(newValue);
    switch(newValue) {
      case 0:
        navigate('/dashboard/profile');
        break;
      case 1:
        navigate('/dashboard/calendar');
        break;
      case 2:
        navigate('/dashboard/schedule');
        break;
      default:
        navigate('/dashboard/profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <AppBar position="static">
        <Toolbar className="justify-between">
          <Typography variant="h6">
            Meeting Scheduler
          </Typography>
          <div className="flex items-center space-x-4">
            <Typography variant="body1">
              {user?.fullName}
            </Typography>
            <Button 
              color="inherit" 
              onClick={handleLogout}
              startIcon={<LogoutOutlined />}
            >
              Logout
            </Button>
          </div>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="User Profile" />
          <Tab label="Calendar" />
          <Tab label="Schedule Meeting" />
        </Tabs>
      </Box>

      <div className="p-4">
        <Routes>
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/schedule" element={<ScheduleMeeting />} />
          <Route path="/" element={<UserProfile />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard; 