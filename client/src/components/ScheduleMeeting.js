import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function ScheduleMeeting() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    datetime: new Date(),
    duration: 30,
    participants: []
  });

  // Mock data for participants (replace with API call)
  const mockUsers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDateTimeChange = (newValue) => {
    setFormData({
      ...formData,
      datetime: newValue
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add API call to schedule meeting
    console.log('Meeting scheduled:', formData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Schedule a Meeting</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Meeting Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Meeting Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />

          <DateTimePicker
            label="Date & Time"
            value={formData.datetime}
            onChange={handleDateTimeChange}
            className="w-full"
            required
          />

          <FormControl fullWidth>
            <InputLabel>Duration (minutes)</InputLabel>
            <Select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
            >
              <MenuItem value={15}>15 minutes</MenuItem>
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={45}>45 minutes</MenuItem>
              <MenuItem value={60}>1 hour</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            options={mockUsers}
            getOptionLabel={(option) => option.name}
            onChange={(event, newValue) => {
              setFormData({
                ...formData,
                participants: newValue
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Participants"
                required
              />
            )}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            className="w-full"
          >
            Schedule Meeting
          </Button>
        </form>
      </Paper>
    </LocalizationProvider>
  );
}

export default ScheduleMeeting; 