import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutOutlined } from '@mui/icons-material';
import { Button, Container, Paper, Tab, Tabs, IconButton, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import UserProfile from '../components/UserProfile';
import Calendar from '../components/Calendar';
import ScheduleMeeting from '../components/ScheduleMeeting';

function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <Container maxWidth="lg">
          <div className="flex justify-between items-center py-4">
            <Typography variant="h5" component="h1">
              Meeting Scheduler
            </Typography>
            <IconButton onClick={handleLogout} color="primary" title="Logout">
              <LogoutOutlined />
            </IconButton>
          </div>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Profile" />
            <Tab label="Availability" />
            <Tab label="Schedule Meeting" />
          </Tabs>
        </Container>
      </div>

      <Container maxWidth="lg" className="mt-6">
        <div className="py-6">
          {activeTab === 0 && <UserProfile />}
          {activeTab === 1 && <Calendar />}
          {activeTab === 2 && <ScheduleMeeting />}
        </div>
      </Container>
    </div>
  );
}

export default Dashboard; 