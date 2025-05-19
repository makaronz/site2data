import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme, Button, CircularProgress } from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import useGlobalStore from '../store/globalStore';
import apiClient, { LoadingIndicator, ErrorIndicator } from '../api/apiClient';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

/**
 * Shooting Day Planner View
 * 
 * Role: 1st AD
 * 
 * Features:
 * - Calendar view of shooting schedule
 * - Events: scenes grouped by shooting day
 * - Tooltips with scene details
 * - CSV export functionality
 */
const ShootingPlanner: React.FC = () => {
  const theme = useTheme();
  const { highContrast, setSelectedScene } = useGlobalStore();
  
  // State for API data and UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  
  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getSchedule();
        setSchedule(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Failed to load shooting schedule. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedule();
  }, []);
  
  // Transform schedule data into calendar events
  useEffect(() => {
    if (!schedule.length) return;
    
    const events = schedule.flatMap(day => {
      return day.scenes.map((scene: any) => {
        // Calculate duration based on page count (1 page ≈ 1 minute of screen time)
        // For shooting, estimate 1 page takes about 1 hour to shoot
        const durationHours = Math.max(1, Math.ceil(scene.pageCount));
        
        // Create start and end times
        const startTime = new Date(day.date);
        startTime.setHours(day.startTime.hour, day.startTime.minute, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + durationHours);
        
        // Get location type (INT/EXT) for color coding
        const isExterior = scene.location.startsWith('EXT');
        
        return {
          id: scene.id,
          title: `Scene ${scene.number}: ${scene.location}`,
          start: startTime,
          end: endTime,
          allDay: false,
          resource: scene,
          backgroundColor: isExterior 
            ? theme.palette.info.main  // Exterior scenes
            : theme.palette.warning.main  // Interior scenes
        };
      });
    });
    
    setCalendarEvents(events);
  }, [schedule, theme]);
  
  // Custom event component for the calendar
  const EventComponent = ({ event }: any) => {
    const scene = event.resource;
    
    return (
      <Box sx={{ 
        height: '100%', 
        p: 0.5,
        overflow: 'hidden',
        backgroundColor: event.backgroundColor,
        color: theme.palette.getContrastText(event.backgroundColor),
        borderRadius: 1,
        fontSize: '0.85rem',
        '&:hover': {
          filter: 'brightness(0.9)'
        }
      }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
          Scene {scene.number}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {scene.location}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.75rem' }}>
          {scene.characters.length} cast • {scene.pageCount} pages
        </Typography>
      </Box>
    );
  };
  
  // Custom tooltip component for calendar events
  const EventTooltip = ({ event }: any) => {
    const scene = event.resource;
    
    return (
      <Paper 
        elevation={3}
        sx={{ 
          p: 2, 
          maxWidth: 300,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Scene {scene.number}: {scene.location}
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>Cast:</strong> {scene.characters.join(', ')}
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>Pages:</strong> {scene.pageCount}
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>Mood:</strong> {scene.mood}
        </Typography>
        
        {scene.props && scene.props.length > 0 && (
          <Typography variant="body2" gutterBottom>
            <strong>Props:</strong> {scene.props.join(', ')}
          </Typography>
        )}
        
        {scene.notes && (
          <Typography variant="body2">
            <strong>Notes:</strong> {scene.notes}
          </Typography>
        )}
      </Paper>
    );
  };
  
  // Export schedule as CSV
  const exportAsCSV = () => {
    if (!schedule.length) return;
    
    // Create CSV header
    const header = 'Date,Scene,Location,Start Time,End Time,Cast,Pages,Props,Notes\n';
    
    // Create CSV rows
    const rows = schedule.flatMap(day => {
      return day.scenes.map((scene: any) => {
        // Format date
        const date = moment(day.date).format('YYYY-MM-DD');
        
        // Format start time
        const startTime = `${day.startTime.hour}:${day.startTime.minute.toString().padStart(2, '0')}`;
        
        // Calculate end time based on page count
        const durationHours = Math.max(1, Math.ceil(scene.pageCount));
        const endHour = day.startTime.hour + durationHours;
        const endTime = `${endHour}:${day.startTime.minute.toString().padStart(2, '0')}`;
        
        // Format other fields
        const sceneNumber = scene.number;
        const location = scene.location.replace(/,/g, ';'); // Replace commas to avoid CSV issues
        const cast = scene.characters.join(';');
        const pages = scene.pageCount;
        const props = scene.props ? scene.props.join(';') : '';
        const notes = scene.notes ? scene.notes.replace(/,/g, ';') : '';
        
        return `${date},${sceneNumber},${location},${startTime},${endTime},${cast},${pages},${props},${notes}`;
      });
    }).join('\n');
    
    // Combine header and rows
    const csv = header + rows;
    
    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'shooting-schedule.csv';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Handle event click
  const handleEventClick = (event: any) => {
    setSelectedScene(event.resource);
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Shooting Day Planner
      </Typography>
      
      <Typography variant="body1" paragraph>
        Plan and organize shooting days with a calendar view of all scenes.
      </Typography>
      
      {/* Controls */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Legend:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                backgroundColor: theme.palette.info.main,
                borderRadius: 1,
                mr: 1
              }} />
              <Typography variant="body2">Exterior Scenes</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                backgroundColor: theme.palette.warning.main,
                borderRadius: 1,
                mr: 1
              }} />
              <Typography variant="body2">Interior Scenes</Typography>
            </Box>
          </Box>
        </Box>
        
        <Button 
          variant="contained" 
          onClick={exportAsCSV}
          disabled={loading || !!error || !schedule.length}
        >
          Export as CSV
        </Button>
      </Paper>
      
      {/* Calendar */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2,
          height: 600,
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        {loading ? (
          <LoadingIndicator />
        ) : error ? (
          <ErrorIndicator message={error} />
        ) : schedule.length > 0 ? (
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 550 }}
            defaultView="week"
            views={['day', 'week', 'month']}
            step={60}
            showMultiDayTimes
            components={{
              event: EventComponent,
              eventWrapper: (props) => (
                <div
                  title=""
                  data-tip
                  data-for={`event-tooltip-${props.event.id}`}
                  onClick={() => handleEventClick(props.event)}
                  style={{ cursor: 'pointer' }}
                >
                  {props.children}
                  <div style={{ display: 'none' }}>
                    <EventTooltip event={props.event} />
                  </div>
                </div>
              )
            }}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: 'transparent',
                border: 'none'
              }
            })}
            dayPropGetter={(date) => {
              // Highlight weekends
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return {
                style: {
                  backgroundColor: isWeekend 
                    ? theme.palette.mode === 'dark' 
                      ? 'rgba(0, 0, 0, 0.2)' 
                      : 'rgba(0, 0, 0, 0.05)'
                    : undefined
                }
              };
            }}
          />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%'
          }}>
            <Typography variant="body1" color="text.secondary">
              No shooting schedule available
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ShootingPlanner;
