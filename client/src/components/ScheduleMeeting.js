import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TextField, 
  Button, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../services/api.config';
import LoadingSpinner from './LoadingSpinner';
import { isWithinInterval, addMinutes } from 'date-fns';
import { Check as CheckIcon, Close as CloseIcon, HourglassEmpty as PendingIcon, Person as PersonIcon } from '@mui/icons-material';

function ScheduleMeeting() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    datetime: new Date(),
    duration: 30,
    participants: []
  });

  const fetchParticipantsAvailability = useCallback(async () => {
    try {
      const participantIds = formData.participants.map(p => p.id);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Get availability for next 3 months

      const availabilityPromises = participantIds.map(userId =>
        api.get(`/users/${userId}/availability`, {
          params: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }
        })
      );

      const responses = await Promise.all(availabilityPromises);
      
      // Combine all unavailable dates from all participants
      const allUnavailableDates = responses.flatMap(response => 
        response.data.filter(date => !date.is_available).map(date => date.date)
      );

      // Also fetch existing meetings for all participants
      const meetingsPromises = participantIds.map(userId =>
        api.get(`/users/${userId}/meetings`)
      );

      const meetingsResponses = await Promise.all(meetingsPromises);
      
      // Add meeting times to unavailable dates
      const meetingUnavailableDates = meetingsResponses.flatMap(response => {
        const meetings = response.data.meetings || [];
        return meetings.map(meeting => ({
          start: new Date(meeting.datetime),
          end: addMinutes(new Date(meeting.datetime), meeting.duration)
        }));
      });

      setUnavailableDates([
        ...new Set(allUnavailableDates), // Remove duplicates from full-day unavailability
        ...meetingUnavailableDates // Add meeting time ranges
      ]);

    } catch (error) {
      console.error('Error fetching participants availability:', error);
    }
  }, [formData.participants]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [meetingsResponse, usersResponse] = await Promise.all([
        fetchMeetings(),
        fetchUsers()
      ]);
      
      if (meetingsResponse?.data?.meetings) {
        setMeetings(meetingsResponse.data.meetings);
      }
      
      if (usersResponse?.data) {
        console.log('Setting users:', usersResponse.data);
        setUsers(usersResponse.data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (formData.participants.length > 0) {
      fetchParticipantsAvailability();
    } else {
      setUnavailableDates([]);
    }
  }, [formData.participants, fetchParticipantsAvailability]);

  const isDateTimeUnavailable = (dateTime) => {
    // Check if the date is in the unavailable dates list
    const dateStr = dateTime.toISOString().split('T')[0];
    
    // Check full-day unavailability
    if (unavailableDates.includes(dateStr)) {
      return true;
    }

    // Check meeting time ranges
    const meetingEnd = addMinutes(dateTime, formData.duration);
    return unavailableDates.some(unavailable => {
      if (typeof unavailable === 'object') {
        return isWithinInterval(dateTime, unavailable) ||
               isWithinInterval(meetingEnd, unavailable);
      }
      return false;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateTimeChange = (newValue) => {
    setFormData(prev => ({
      ...prev,
      datetime: newValue
    }));
  };

  const fetchMeetings = async () => {
    try {
      console.log('Fetching meetings...');
      const response = await api.get('/meetings');
      console.log('Meetings response:', response.data);
      if (response.data?.success && response.data?.data?.meetings) {
        // Sort meetings by date, most recent first
        const sortedMeetings = response.data.data.meetings.sort((a, b) => 
          new Date(b.start_time) - new Date(a.start_time)
        );
        return { data: { meetings: sortedMeetings } };
      }
      return { data: { meetings: [] } };
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return { data: { meetings: [] } };
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await api.get('/users/list');
      console.log('Users response:', response.data);
      if (response.data && response.data.success) {
        // Only filter if currentUser exists and has an id
        const users = currentUser?.id 
          ? response.data.data.filter(user => user.id !== currentUser.id)
          : response.data.data;
        return { data: users };
      }
      return null;
    } catch (error) {
      console.error('Error fetching users:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.participants.length === 0) {
      alert('Please select at least one participant');
      return;
    }
    setIsSaving(true);
    try {
      console.log('Submitting meeting data:', formData);
      const response = await api.post('/meetings', {
        ...formData,
        participants: formData.participants.map(user => user.id)
      });
      console.log('Meeting created:', response.data);
      
      // Refresh meetings list
      await loadInitialData();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        datetime: new Date(),
        duration: 30,
        participants: []
      });
      
      alert('Meeting scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Error scheduling meeting. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMeetingResponse = async (meetingId, status) => {
    try {
      await api.put(`/meetings/${meetingId}/status`, { status });
      await loadInitialData(); // Refresh the meetings list
      alert(`Meeting ${status} successfully`);
    } catch (error) {
      console.error('Error updating meeting status:', error);
      alert('Error updating meeting status. Please try again.');
    }
  };

  const renderMeetingActions = (meeting) => {
    // Check if current user is a participant (not the creator)
    const isParticipant = meeting.participants?.some(
      p => p.id === currentUser?.id && p.id !== meeting.created_by
    );
    
    if (!isParticipant) {
      return null;
    }

    const userStatus = meeting.participants?.find(
      p => p.id === currentUser?.id
    )?.status;

    if (userStatus === 'pending') {
      return (
        <div className="flex gap-2 mt-2">
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={() => handleMeetingResponse(meeting.id, 'accepted')}
          >
            Accept
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<CloseIcon />}
            onClick={() => handleMeetingResponse(meeting.id, 'declined')}
          >
            Decline
          </Button>
        </div>
      );
    }

    return (
      <div className="mt-2">
        <Typography variant="body2" color={userStatus === 'accepted' ? 'success.main' : 'error.main'}>
          Status: {userStatus?.charAt(0).toUpperCase() + userStatus?.slice(1)}
        </Typography>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Paper className="p-6">
          <Typography variant="h6" className="mb-4">Schedule New Meeting</Typography>
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

            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(option) => `${option.fullName || option.email}`}
              value={formData.participants}
              onChange={(event, newValue) => {
                console.log('Selected participants:', newValue);
                setFormData(prev => ({
                  ...prev,
                  participants: newValue
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Participants"
                  error={formData.participants.length === 0}
                  helperText={formData.participants.length === 0 ? "Please select at least one participant" : ""}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <div>
                    <div>{option.fullName || 'No name'}</div>
                    <div className="text-sm text-gray-500">{option.email}</div>
                  </div>
                </li>
              )}
            />

            <DateTimePicker
              label="Date & Time"
              value={formData.datetime}
              onChange={handleDateTimeChange}
              className="w-full"
              required
              renderInput={(params) => <TextField {...params} fullWidth />}
              shouldDisableDate={isDateTimeUnavailable}
              minDate={new Date()} // Prevent selecting past dates
              minTime={new Date().setHours(9, 0)} // Set business hours start
              maxTime={new Date().setHours(17, 0)} // Set business hours end
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

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSaving}
            >
              {isSaving ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </form>
        </Paper>

        <Paper className="p-6">
          <Typography variant="h6" className="mb-4">Upcoming Meetings</Typography>
          {meetings.length === 0 ? (
            <Typography color="textSecondary">No upcoming meetings</Typography>
          ) : (
            <List>
              {meetings.map((meeting) => (
                <ListItem 
                  key={meeting.id} 
                  divider
                  className="flex flex-col items-stretch p-4"
                >
                  <ListItemText
                    primary={
                      <div className="flex justify-between items-center mb-2">
                        <Typography variant="h6" component="span">
                          {meeting.title}
                        </Typography>
                        {meeting.created_by === currentUser?.id && (
                          <Typography 
                            variant="caption" 
                            color="primary"
                            className="flex items-center gap-1"
                          >
                            <PersonIcon fontSize="small" />
                            Organizer
                          </Typography>
                        )}
                      </div>
                    }
                    secondary={
                      <>
                        <div className="space-y-2">
                          <div>
                            <strong>Date & Time:</strong>{' '}
                            {new Date(meeting.start_time).toLocaleString()}
                          </div>
                          <div>
                            <strong>Duration:</strong> {meeting.duration} minutes
                          </div>
                          {meeting.description && (
                            <div>
                              <strong>Description:</strong> {meeting.description}
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <Typography variant="subtitle2" gutterBottom>
                              Participants:
                            </Typography>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {meeting.participants?.map(p => (
                                <div 
                                  key={p.id}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
                                >
                                  <div className="flex-1">
                                    <Typography variant="body2">
                                      {p.fullName || p.email}
                                    </Typography>
                                  </div>
                                  <div>
                                    {p.status === 'accepted' ? (
                                      <CheckIcon color="success" fontSize="small" titleAccess="Accepted" />
                                    ) : p.status === 'declined' ? (
                                      <CloseIcon color="error" fontSize="small" titleAccess="Declined" />
                                    ) : (
                                      <PendingIcon color="action" fontSize="small" titleAccess="Pending" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {renderMeetingActions(meeting)}
                        </div>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </div>
    </LocalizationProvider>
  );
}

export default ScheduleMeeting; 