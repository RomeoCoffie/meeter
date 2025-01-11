import { useState, useEffect, useCallback } from 'react';
import { TextField, Button, RadioGroup, FormControlLabel, Radio, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api.config';
import LoadingSpinner from './LoadingSpinner';

function UserProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userType, setUserType] = useState(user?.userType || 'freelancer');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    skills: '',
    hourlyRate: '',
    experience: '',
    company: '',
    industry: '',
    projectDescription: ''
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      console.log('Fetching user profile...');
      const response = await api.get('/users/profile');
      console.log('Profile data received:', response.data);
      
      if (response.data && response.data.data) {
        const profileData = response.data.data;
        setFormData({
          fullName: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          skills: profileData.skills || '',
          hourlyRate: profileData.hourly_rate || '',
          experience: profileData.experience || '',
          company: profileData.company || '',
          industry: profileData.industry || '',
          projectDescription: profileData.project_description || ''
        });
        setUserType(profileData.user_type || user?.userType || 'freelancer');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userType]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updateData = {
        ...formData,
        userType
      };
      console.log('Saving profile data:', updateData);
      
      const response = await api.put('/users/profile', updateData);
      console.log('Save response:', response.data);
      
      if (response.data.success) {
        // Fetch the updated profile data
        await fetchUserProfile();
        alert('Profile updated successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Field changed:', name, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Paper className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">User Profile</h2>
      
      <RadioGroup
        row
        value={userType}
        onChange={(e) => setUserType(e.target.value)}
        className="mb-6"
      >
        <FormControlLabel value="freelancer" control={<Radio />} label="Freelancer" />
        <FormControlLabel value="client" control={<Radio />} label="Client" />
      </RadioGroup>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          fullWidth
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <TextField
          fullWidth
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />

        {userType === 'freelancer' && (
          <>
            <TextField
              fullWidth
              label="Skills (comma separated)"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Hourly Rate ($)"
              name="hourlyRate"
              type="number"
              value={formData.hourlyRate}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              label="Years of Experience"
              name="experience"
              type="number"
              value={formData.experience}
              onChange={handleChange}
            />
          </>
        )}

        {userType === 'client' && (
          <>
            <TextField
              fullWidth
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              label="Project Description"
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </Paper>
  );
}

export default UserProfile; 