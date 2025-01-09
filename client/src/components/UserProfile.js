import { useState } from 'react';
import { TextField, Button, RadioGroup, FormControlLabel, Radio, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function UserProfile() {
  const { user } = useAuth();
  const [userType, setUserType] = useState('freelancer');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    // Freelancer specific fields
    skills: '',
    hourlyRate: '',
    experience: '',
    // Client specific fields
    company: '',
    industry: '',
    projectDescription: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add API call to update profile
    console.log('Form submitted:', formData);
  };

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
        {/* Common Fields */}
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
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />

        {/* Conditional Fields */}
        {userType === 'freelancer' ? (
          <>
            <TextField
              fullWidth
              label="Skills (comma separated)"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Hourly Rate ($)"
              name="hourlyRate"
              type="number"
              value={formData.hourlyRate}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Years of Experience"
              name="experience"
              type="number"
              value={formData.experience}
              onChange={handleChange}
              required
            />
          </>
        ) : (
          <>
            <TextField
              fullWidth
              label="Company Name"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Project Description"
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleChange}
            />
          </>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="w-full"
        >
          Save Profile
        </Button>
      </form>
    </Paper>
  );
}

export default UserProfile; 