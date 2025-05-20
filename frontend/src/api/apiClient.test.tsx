import axios from 'axios';
import apiClient from './apiClient';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully fetch all scenes when the API returns a valid response', async () => {
    const mockScenesResponse = {
      data: {
        scenes: [
          { id: 'scene1', number: 1, location: 'INT. APARTMENT - DAY', characters: ['JOHN', 'MARY'] },
          { id: 'scene2', number: 2, location: 'EXT. STREET - NIGHT', characters: ['JOHN'] }
        ]
      }
    };

    mockedAxios.get.mockResolvedValueOnce(mockScenesResponse);

    const scenes = await apiClient.getScenes();

    expect(scenes).toEqual(mockScenesResponse.data.scenes);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/scenes');
  });

  it('should handle and log an error when fetching scenes fails due to network issues', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const errorMessage = 'Network Error';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(apiClient.getScenes()).rejects.toThrow('Network Error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching scenes:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should return the correct scene data when fetching a scene by a valid ID', async () => {
    const mockSceneResponse = {
      data: {
        id: 'scene1',
        number: 1,
        location: 'INT. APARTMENT - DAY',
        characters: ['JOHN', 'MARY']
      }
    };

    mockedAxios.get.mockResolvedValueOnce(mockSceneResponse);

    const scene = await apiClient.getSceneById('scene1');

    expect(scene).toEqual(mockSceneResponse.data);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/scenes/scene1');
  });

  it('should handle and log an error when fetching character graph data fails due to server error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const errorMessage = 'Server Error';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(apiClient.getCharacterGraph()).rejects.toThrow('Server Error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching character graph:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should successfully fetch character graph data when the API returns a valid response', async () => {
    const mockCharacterGraphResponse = {
      data: {
        nodes: [
          { id: 'john', label: 'John' },
          { id: 'mary', label: 'Mary' }
        ],
        edges: [
          { from: 'john', to: 'mary', relationship: 'friend' }
        ]
      }
    };

    mockedAxios.get.mockResolvedValueOnce(mockCharacterGraphResponse);

    const characterGraph = await apiClient.getCharacterGraph();

    expect(characterGraph).toEqual(mockCharacterGraphResponse.data);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/graph/characters');
  });

  it('should successfully fetch character graph data for a specific scene with a valid scene ID', async () => {
    const mockSceneCharacterGraphResponse = {
      data: {
        nodes: [
          { id: 'john', label: 'John' },
          { id: 'mary', label: 'Mary' }
        ],
        edges: [
          { from: 'john', to: 'mary', relationship: 'friend' }
        ]
      }
    };

    mockedAxios.get.mockResolvedValueOnce(mockSceneCharacterGraphResponse);

    const sceneCharacterGraph = await apiClient.getSceneCharacterGraph('scene1');

    expect(sceneCharacterGraph).toEqual(mockSceneCharacterGraphResponse.data);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/graph/scene/scene1');
  });

  it('should throw an error when fetching character graph data for a scene with an invalid scene ID', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const errorMessage = 'Invalid Scene ID';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(apiClient.getSceneCharacterGraph('invalidSceneId')).rejects.toThrow('Invalid Scene ID');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching character graph for scene invalidSceneId:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should successfully fetch all locations when the API returns a valid response', async () => {
    const mockLocationsResponse = {
      data: [
        { id: 'location1', name: 'INT. APARTMENT - DAY' },
        { id: 'location2', name: 'EXT. STREET - NIGHT' }
      ]
    };

    mockedAxios.get.mockResolvedValueOnce(mockLocationsResponse);

    const locations = await apiClient.getLocations();

    expect(locations).toEqual(mockLocationsResponse.data);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/locations');
  });

  it('should handle and log an error when fetching locations fails due to a timeout', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const errorMessage = 'timeout of 0ms exceeded';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(apiClient.getLocations()).rejects.toThrow('timeout of 0ms exceeded');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching locations:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should successfully fetch all props when the API returns a valid response', async () => {
    const mockPropsResponse = {
      data: [
        { id: 'prop1', name: 'Laptop', type: 'electronics', scenes: ['scene1', 'scene3'] },
        { id: 'prop2', name: 'Gun', type: 'weapon', scenes: ['scene2'] }
      ]
    };

    mockedAxios.get.mockResolvedValueOnce(mockPropsResponse);

    const props = await apiClient.getProps();

    expect(props).toEqual(mockPropsResponse.data);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/props');
  });
});
