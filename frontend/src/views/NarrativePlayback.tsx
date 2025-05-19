import React from 'react';
import { Box, Typography, Paper, useTheme, Button, Slider, IconButton } from '@mui/material';
import { PlayArrow, Pause, SkipPrevious, SkipNext } from '@mui/icons-material';
import useGlobalStore from '../store/globalStore';

/**
 * Narrative Playback Mode View
 * 
 * Features:
 * - Timeline-based scene exploration
 * - Dynamic character relationship graph
 * - Scene details panel
 * - Play/pause/navigation controls
 */
const NarrativePlayback: React.FC = () => {
  const theme = useTheme();
  const { highContrast } = useGlobalStore();
  
  // Mock data for scenes (will be replaced with API data)
  const mockScenes = [
    { id: 1, number: 1, location: 'INT. APARTMENT - DAY', characters: ['JOHN', 'MARY'], mood: 'tense', summary: 'John and Mary argue about their relationship.' },
    { id: 2, number: 2, location: 'EXT. STREET - NIGHT', characters: ['JOHN'], mood: 'mysterious', summary: 'John walks alone, contemplating his next move.' },
    { id: 3, number: 3, location: 'INT. OFFICE - DAY', characters: ['MARY', 'BOSS'], mood: 'professional', summary: 'Mary discusses her career with her boss.' },
    { id: 4, number: 4, location: 'EXT. PARK - DAY', characters: ['JOHN', 'MARY'], mood: 'romantic', summary: 'John and Mary reconcile in the park.' },
    { id: 5, number: 5, location: 'INT. RESTAURANT - NIGHT', characters: ['JOHN', 'MARY', 'WAITER'], mood: 'tense', summary: 'Dinner is interrupted by an unexpected revelation.' },
  ];
  
  // State for current scene and playback
  const [currentSceneIndex, setCurrentSceneIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  
  // Current scene
  const currentScene = mockScenes[currentSceneIndex];
  
  // Get mood emoji
  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'tense': return '😰';
      case 'mysterious': return '🤔';
      case 'professional': return '🧐';
      case 'romantic': return '❤️';
      default: return '😐';
    }
  };
  
  // Handle play/pause
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handle previous scene
  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };
  
  // Handle next scene
  const handleNextScene = () => {
    if (currentSceneIndex < mockScenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };
  
  // Handle timeline change
  const handleTimelineChange = (_event: Event, newValue: number | number[]) => {
    setCurrentSceneIndex(newValue as number);
  };
  
  // Effect for auto-play
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        if (currentSceneIndex < mockScenes.length - 1) {
          setCurrentSceneIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 3000);
    }
    
    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, currentSceneIndex]);
  
  // Effect for keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handlePlayPause();
      } else if (e.code === 'ArrowLeft') {
        handlePrevScene();
      } else if (e.code === 'ArrowRight') {
        handleNextScene();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSceneIndex]);
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Narrative Playback Mode
      </Typography>
      
      <Typography variant="body1" paragraph>
        Explore the screenplay timeline dynamically with character relationships and scene progression.
      </Typography>
      
      {/* Timeline */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mb: 3,
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Scene Timeline
        </Typography>
        
        <Slider
          value={currentSceneIndex}
          onChange={handleTimelineChange}
          step={1}
          marks
          min={0}
          max={mockScenes.length - 1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `Scene ${mockScenes[value].number}`}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption">
            Scene 1
          </Typography>
          <Typography variant="caption">
            Scene {mockScenes.length}
          </Typography>
        </Box>
      </Paper>
      
      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Character Graph */}
        <Paper 
          elevation={2}
          sx={{ 
            p: 2, 
            flex: 2,
            height: 400,
            backgroundColor: highContrast 
              ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
              : theme.palette.background.paper,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Character Relationships - Scene {currentScene.number}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: 'calc(100% - 30px)',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            p: 2
          }}>
            <Typography variant="body1">
              Character relationship graph will be implemented here using @react-sigma/core
            </Typography>
          </Box>
        </Paper>
        
        {/* Scene Card */}
        <Paper 
          elevation={2}
          sx={{ 
            p: 2, 
            flex: 1,
            height: 400,
            backgroundColor: highContrast 
              ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
              : theme.palette.background.paper,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Scene {currentScene.number}
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom>
            {currentScene.location}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" component="span">
              Mood: 
            </Typography>
            <Typography variant="body1" component="span" sx={{ ml: 1 }}>
              {getMoodEmoji(currentScene.mood)} {currentScene.mood}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              Characters:
            </Typography>
            <Typography variant="body1">
              {currentScene.characters.join(', ')}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2">
              Summary:
            </Typography>
            <Typography variant="body1">
              {currentScene.summary}
            </Typography>
          </Box>
        </Paper>
      </Box>
      
      {/* Playback Controls */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mt: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <IconButton onClick={handlePrevScene} disabled={currentSceneIndex === 0}>
          <SkipPrevious />
        </IconButton>
        
        <Button 
          variant="contained" 
          startIcon={isPlaying ? <Pause /> : <PlayArrow />}
          onClick={handlePlayPause}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        
        <IconButton onClick={handleNextScene} disabled={currentSceneIndex === mockScenes.length - 1}>
          <SkipNext />
        </IconButton>
        
        <Typography variant="caption" sx={{ ml: 2 }}>
          Keyboard shortcuts: Space (Play/Pause), ← (Previous), → (Next)
        </Typography>
      </Paper>
    </Box>
  );
};

export default NarrativePlayback;
