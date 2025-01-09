import { useState } from 'react';
import { Paper, Button } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function Calendar() {
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const handleSaveAvailability = () => {
    // TODO: Add API call to save availability
    console.log('Saving unavailable dates:', selectedDates);
  };

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
            date={currentDate}
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
        className="w-full"
      >
        Save Availability
      </Button>
    </Paper>
  );
}

export default Calendar; 