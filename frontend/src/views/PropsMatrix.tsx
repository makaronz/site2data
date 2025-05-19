import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, useTheme, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material';
import useGlobalStore from '../store/globalStore';
import apiClient, { LoadingIndicator, ErrorIndicator } from '../api/apiClient';

/**
 * Props & Equipment Matrix View
 * 
 * Role: Designer / Operator
 * 
 * Features:
 * - Matrix: Scenes (rows) × Props/Vehicles (columns)
 * - Icons for item types
 * - Interactive checkboxes for allocation
 * - Grouping by location or prop category
 */
const PropsMatrix: React.FC = () => {
  const theme = useTheme();
  const { highContrast } = useGlobalStore();
  
  // State for API data and UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [propTypeFilter, setPropTypeFilter] = useState<string>('all');
  const [showMissingOnly, setShowMissingOnly] = useState<boolean>(false);
  const [orderBy, setOrderBy] = useState<string>('number');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  
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
  
  // Fetch props data
  useEffect(() => {
    const fetchProps = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getProps();
        setProps(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching props:', err);
        setError('Failed to load props data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProps();
  }, []);
  
  // Extract unique prop types for filter
  const propTypes = useMemo(() => {
    const types = new Set<string>();
    props.forEach(prop => {
      types.add(prop.type);
    });
    return Array.from(types).sort();
  }, [props]);
  
  // Filter props based on selected type
  const filteredProps = useMemo(() => {
    if (propTypeFilter === 'all') {
      return props;
    }
    return props.filter(prop => prop.type === propTypeFilter);
  }, [props, propTypeFilter]);
  
  // Check if a prop is used in a scene
  const isPropInScene = useCallback((sceneId: string, propId: string) => {
    const prop = props.find(p => p.id === propId);
    return prop?.scenes.includes(sceneId) || false;
  }, [props]);
  
  // Check if a prop is checked
  const isPropChecked = useCallback((sceneId: string, propId: string) => {
    const key = `${sceneId}-${propId}`;
    return checkedItems[key] || false;
  }, [checkedItems]);
  
  // Handle checkbox change
  const handleCheckboxChange = useCallback((sceneId: string, propId: string) => {
    const key = `${sceneId}-${propId}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);
  
  // Get prop icon
  const getPropIcon = useCallback((type: string) => {
    switch (type) {
      case 'vehicle': return '🚗';
      case 'weapon': return '🔫';
      case 'electronics': return '💻';
      case 'furniture': return '🪑';
      case 'clothing': return '👕';
      case 'food': return '🍎';
      case 'drink': return '🥤';
      case 'tool': return '🔧';
      default: return '📦';
    }
  }, []);
  
  // Handle sort request
  const handleRequestSort = useCallback((property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [order, orderBy]);
  
  // Sort scenes
  const sortedScenes = useMemo(() => {
    const comparator = (a: any, b: any) => {
      if (orderBy === 'number') {
        return order === 'asc' ? a.number - b.number : b.number - a.number;
      } else if (orderBy === 'location') {
        return order === 'asc' 
          ? a.location.localeCompare(b.location) 
          : b.location.localeCompare(a.location);
      } else if (orderBy === 'propCount') {
        const aCount = props.filter(p => p.scenes.includes(a.id)).length;
        const bCount = props.filter(p => p.scenes.includes(b.id)).length;
        return order === 'asc' ? aCount - bCount : bCount - aCount;
      }
      return 0;
    };
    
    return [...scenes].sort(comparator);
  }, [scenes, props, order, orderBy]);
  
  // Filter scenes if showing missing only
  const displayedScenes = useMemo(() => {
    if (!showMissingOnly) {
      return sortedScenes;
    }
    
    return sortedScenes.filter(scene => {
      // Check if any filtered props are missing for this scene
      return filteredProps.some(prop => {
        const isInScene = prop.scenes.includes(scene.id);
        const isChecked = isPropChecked(scene.id, prop.id);
        return isInScene && !isChecked;
      });
    });
  }, [sortedScenes, showMissingOnly, filteredProps, isPropChecked]);
  
  // Calculate summary data
  const propSummary = useMemo(() => {
    return filteredProps.map(prop => {
      const allocatedCount = scenes.filter(scene => 
        isPropInScene(scene.id, prop.id) && isPropChecked(scene.id, prop.id)
      ).length;
      
      const requiredCount = prop.scenes.length;
      
      return {
        ...prop,
        allocatedCount,
        requiredCount,
        missingCount: requiredCount - allocatedCount
      };
    });
  }, [filteredProps, scenes, isPropInScene, isPropChecked]);
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Props & Equipment Matrix
      </Typography>
      
      <Typography variant="body1" paragraph>
        Manage and track props and equipment allocation across all scenes.
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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="prop-type-filter-label">Prop Type</InputLabel>
            <Select
              labelId="prop-type-filter-label"
              id="prop-type-filter"
              value={propTypeFilter}
              label="Prop Type"
              onChange={(e) => setPropTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              {propTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {getPropIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={showMissingOnly}
                onChange={(e) => setShowMissingOnly(e.target.checked)}
              />
            }
            label="Show Missing Only"
          />
        </Box>
      </Paper>
      
      {/* Loading and Error States */}
      {loading ? (
        <LoadingIndicator />
      ) : error ? (
        <ErrorIndicator message={error} />
      ) : (
        <>
          {/* Matrix */}
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
            <TableContainer sx={{ maxHeight: 500, overflowX: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'number'}
                        direction={orderBy === 'number' ? order : 'asc'}
                        onClick={() => handleRequestSort('number')}
                      >
                        Scene
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'location'}
                        direction={orderBy === 'location' ? order : 'asc'}
                        onClick={() => handleRequestSort('location')}
                      >
                        Location
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'propCount'}
                        direction={orderBy === 'propCount' ? order : 'asc'}
                        onClick={() => handleRequestSort('propCount')}
                      >
                        Props
                      </TableSortLabel>
                    </TableCell>
                    {filteredProps.map(prop => (
                      <TableCell key={prop.id} align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span role="img" aria-label={prop.type} style={{ fontSize: '1.2rem' }}>
                            {getPropIcon(prop.type)}
                          </span>
                          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            {prop.name}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedScenes.map(scene => (
                    <TableRow 
                      key={scene.id}
                      sx={{ 
                        '&:nth-of-type(even)': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        }
                      }}
                    >
                      <TableCell>{scene.number}</TableCell>
                      <TableCell>{scene.location}</TableCell>
                      <TableCell>
                        {props.filter(p => p.scenes.includes(scene.id)).length}
                      </TableCell>
                      {filteredProps.map(prop => (
                        <TableCell key={prop.id} align="center">
                          <Checkbox
                            size="small"
                            checked={isPropChecked(scene.id, prop.id)}
                            onChange={() => handleCheckboxChange(scene.id, prop.id)}
                            disabled={!isPropInScene(scene.id, prop.id)}
                            sx={{ 
                              p: 0.5,
                              color: isPropInScene(scene.id, prop.id) && !isPropChecked(scene.id, prop.id)
                                ? theme.palette.error.main
                                : undefined
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {displayedScenes.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No scenes match the selected filters
                </Typography>
              </Box>
            )}
          </Paper>
          
          {/* Summary */}
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
              Props Summary
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Prop</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Required</TableCell>
                    <TableCell align="center">Allocated</TableCell>
                    <TableCell align="center">Missing</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {propSummary.map(prop => (
                    <TableRow key={prop.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span role="img" aria-label={prop.type} style={{ fontSize: '1.2rem', marginRight: '8px' }}>
                            {getPropIcon(prop.type)}
                          </span>
                          {prop.name}
                        </Box>
                      </TableCell>
                      <TableCell>{prop.type}</TableCell>
                      <TableCell align="center">{prop.requiredCount}</TableCell>
                      <TableCell align="center">{prop.allocatedCount}</TableCell>
                      <TableCell 
                        align="center"
                        sx={{ 
                          color: prop.missingCount > 0 ? theme.palette.error.main : theme.palette.success.main,
                          fontWeight: prop.missingCount > 0 ? 'bold' : 'normal'
                        }}
                      >
                        {prop.missingCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default PropsMatrix;
