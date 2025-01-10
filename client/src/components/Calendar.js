import { useState, useEffect } from 'react';
import { Paper, Button } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../services/api.config';
import LoadingSpinner from './LoadingSpinner';

function Calendar() {
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleDateSelect = (date) => {
    setCurrentDate(date);
    const dateStr = date.toISOString().split('T')[0];
    
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr];
    });
  };

  const fetchAvailability = async () => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const response = await api.get('/users/availability', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });

      const unavailableDates = response.data
        .filter(date => !date.is_available)
        .map(date => date.date);
      setSelectedDates(unavailableDates);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    setIsSaving(true);
    try {
      await api.post('/users/availability', {
        dates: selectedDates,
        isAvailable: false
      });
      // Show success message
    } catch (error) {
      console.error('Error saving availability:', error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Paper className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manage Availability</h2>
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Select dates when you are NOT available for meetings
        </p>
      </div>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className="flex flex-col items-center">
          <DateCalendar
            value={currentDate}
            onChange={handleDateSelect}
            className="mb-4"
          />
        </div>
      </LocalizationProvider>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Selected Unavailable Dates:</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedDates.map(date => (
            <span
              key={date}
              className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
            >
              {new Date(date).toLocaleDateString()}
            </span>
          ))}
        </div>
      </div>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveAvailability}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? 'Saving...' : 'Save Availability'}
      </Button>
    </Paper>
  );
}

export default Calendar; 