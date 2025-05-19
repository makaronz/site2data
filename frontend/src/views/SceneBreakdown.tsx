import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useGlobalStore from '../store/globalStore';
import apiClient, { LoadingIndicator, ErrorIndicator } from '../api/apiClient';

/**
 * Mood Graph Component
 * 
 * Visualizes the emotional progression throughout scenes using Recharts
 */
const MoodGraph: React.FC<{
  scenes: any[];
  selectedCharacter: string | null;
  selectedLocation: string | null;
}> = ({ scenes, selectedCharacter, selectedLocation }) => {
  const theme = useTheme();
  const { highContrast } = useGlobalStore();
  
  // Transform scene data for the chart
  const chartData = scenes
    .filter(scene => {
      // Apply character filter if selected
      if (selectedCharacter && !scene.characters.includes(selectedCharacter)) {
        return false;
      }
      
      // Apply location filter if selected
      if (selectedLocation && !scene.location.includes(selectedLocation)) {
        return false;
      }
      
      return true;
    })
    .map(scene => {
      // Convert mood string to numeric value for the chart
      let moodValue = 0;
      switch (scene.mood) {
        case 'tense': moodValue = -3; break;
        case 'mysterious': moodValue = -1; break;
        case 'professional': moodValue = 0; break;
        case 'romantic': moodValue = 4; break;
        case 'happy': moodValue = 5; break;
        case 'sad': moodValue = -4; break;
        case 'angry': moodValue = -5; break;
        case 'fearful': moodValue = -3; break;
        case 'surprised': moodValue = 2; break;
        default: moodValue = 0;
      }
      
      return {
        name: `Scene ${scene.number}`,
        mood: moodValue,
        moodLabel: scene.mood,
        location: scene.location
      };
    });
  
  // Get mood color based on value
  const getMoodColor = (value: number) => {
    if (value > 3) return theme.palette.success.main;
    if (value > 0) return theme.palette.info.main;
    if (value > -3) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" sx={{ color: payload[0].color }}>
            Mood: {payload[0].payload.moodLabel} ({payload[0].value})
          </Typography>
          <Typography variant="body2">
            Location: {payload[0].payload.location}
          </Typography>
        </Paper>
      );
    }
    
    return null;
  };
  
  return (
    <Box sx={{ width: '100%', height: 300 }}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey="name" 
              stroke={highContrast ? theme.palette.text.primary : theme.palette.text.secondary}
            />
            <YAxis 
              domain={[-5, 5]} 
              stroke={highContrast ? theme.palette.text.primary : theme.palette.text.secondary}
              label={{ 
                value: 'Mood', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: theme.palette.text.secondary }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="mood"
              name="Emotional Progression"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={{ 
                stroke: theme.palette.background.paper, 
                strokeWidth: 2,
                r: 6,
                fill: (entry: any) => getMoodColor(entry.mood)
              }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 1
        }}>
          <Typography variant="body1" color="text.secondary">
            No data available for the selected filters
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * Scene Breakdown View
 * 
 * Role: Director / 1st AD
 * 
 * Features:
 * - Grid view of all scenes
 * - Mood line graph for emotional progression
 * - Filters for location, mood, risk score
 */
const SceneBreakdown: React.FC = () => {
  const theme = useTheme();
  const { highContrast, setSelectedScene } = useGlobalStore();
  
  // State for API data and UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  
  // Fetch scenes data
  useEffect(() => {
    const fetchScenes = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getScenes();
        setScenes(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching scenes:', err);
        setError('Failed to load scenes data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScenes();
  }, []);
  
  // Extract unique characters, locations, and moods for filters
  const uniqueCharacters = React.useMemo(() => {
    const characters = new Set<string>();
    scenes.forEach(scene => {
      scene.characters.forEach((character: string) => {
        characters.add(character);
      });
    });
    return Array.from(characters).sort();
  }, [scenes]);
  
  const uniqueLocations = React.useMemo(() => {
    return Array.from(new Set(scenes.map(scene => scene.location))).sort();
  }, [scenes]);
  
  const uniqueMoods = React.useMemo(() => {
    return Array.from(new Set(scenes.map(scene => scene.mood))).sort();
  }, [scenes]);
  
  // Filter scenes based on selected filters
  const filteredScenes = React.useMemo(() => {
    return scenes.filter(scene => {
      // Filter by character
      if (selectedCharacter && !scene.characters.includes(selectedCharacter)) {
        return false;
      }
      
      // Filter by location
      if (selectedLocation && !scene.location.includes(selectedLocation)) {
        return false;
      }
      
      // Filter by mood
      if (selectedMood && scene.mood !== selectedMood) {
        return false;
      }
      
      return true;
    });
  }, [scenes, selectedCharacter, selectedLocation, selectedMood]);
  
  // Get mood emoji
  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'tense': return '😰';
      case 'mysterious': return '🤔';
      case 'professional': return '🧐';
      case 'romantic': return '❤️';
      case 'happy': return '😄';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'fearful': return '😨';
      case 'surprised': return '😮';
      default: return '😐';
    }
  };
  
  // Get risk indicator
  const getRiskIndicator = (risk: string) => {
    switch (risk) {
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Scene Breakdown
      </Typography>
      
      <Typography variant="body1" paragraph>
        View and analyze all scenes in the script. Click on a scene to see detailed information.
      </Typography>
      
      {/* Filters */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mb: 4,
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="character-filter-label">Character</InputLabel>
            <Select
              labelId="character-filter-label"
              id="character-filter"
              value={selectedCharacter || ''}
              label="Character"
              onChange={(e) => setSelectedCharacter(e.target.value || null)}
            >
              <MenuItem value="">All Characters</MenuItem>
              {uniqueCharacters.map(character => (
                <MenuItem key={character} value={character}>{character}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="location-filter-label">Location</InputLabel>
            <Select
              labelId="location-filter-label"
              id="location-filter"
              value={selectedLocation || ''}
              label="Location"
              onChange={(e) => setSelectedLocation(e.target.value || null)}
            >
              <MenuItem value="">All Locations</MenuItem>
              {uniqueLocations.map(location => (
                <MenuItem key={location} value={location}>{location}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="mood-filter-label">Mood</InputLabel>
            <Select
              labelId="mood-filter-label"
              id="mood-filter"
              value={selectedMood || ''}
              label="Mood"
              onChange={(e) => setSelectedMood(e.target.value || null)}
            >
              <MenuItem value="">All Moods</MenuItem>
              {uniqueMoods.map(mood => (
                <MenuItem key={mood} value={mood}>
                  {getMoodEmoji(mood)} {mood}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      {/* Loading and Error States */}
      {loading ? (
        <LoadingIndicator />
      ) : error ? (
        <ErrorIndicator message={error} />
      ) : (
        <>
          {/* Scene Grid */}
          <Paper 
            elevation={2}
            sx={{ 
              p: 2, 
              mb: 4,
              backgroundColor: highContrast 
                ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
                : theme.palette.background.paper,
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Scenes ({filteredScenes.length})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredScenes.length === scenes.length 
                  ? 'Showing all scenes' 
                  : `Filtered from ${scenes.length} total scenes`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: '1fr 4fr 3fr 2fr 2fr', gap: 2, p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Scene</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Location</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Characters</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Mood</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Risk</Typography>
            </Box>
            
            {filteredScenes.length > 0 ? (
              filteredScenes.map((scene) => (
                <Paper 
                  key={scene.id}
                  elevation={1}
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                    backgroundColor: highContrast 
                      ? theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'
                      : theme.palette.background.paper,
                  }}
                  onClick={() => setSelectedScene(scene)}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 4fr 3fr 2fr 2fr', gap: 2 }}>
                    <Typography>{scene.number}</Typography>
                    <Typography>{scene.location}</Typography>
                    <Typography>{scene.characters.join(', ')}</Typography>
                    <Typography>
                      {getMoodEmoji(scene.mood)} {scene.mood}
                    </Typography>
                    <Typography>
                      {getRiskIndicator(scene.risk)} {scene.risk}
                    </Typography>
                  </Box>
                </Paper>
              ))
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No scenes match the selected filters
                </Typography>
              </Box>
            )}
          </Paper>
          
          {/* Mood Line Graph */}
          <Paper 
            elevation={2}
            sx={{ 
              p: 2, 
              backgroundColor: highContrast 
                ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
                : theme.palette.background.paper,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Mood Progression
            </Typography>
            
            <MoodGraph 
              scenes={scenes} 
              selectedCharacter={selectedCharacter} 
              selectedLocation={selectedLocation} 
            />
          </Paper>
        </>
      )}
    </Box>
  );
};

export default SceneBreakdown;
