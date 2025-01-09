import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box } from '@mui/material';
import UserProfile from '../components/UserProfile';
import Calendar from '../components/Calendar';
import ScheduleMeeting from '../components/ScheduleMeeting';

function Dashboard() {
  const [value, setValue] = useState(0);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen">
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