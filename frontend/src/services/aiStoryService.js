import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const storyService = {
  generateStory: async (taskData) => {
    try {
      if (!taskData.teamId || !taskData.characterLevel) {
        throw new Error('Missing required fields: teamId or characterLevel');
      }

      const response = await axios.post(`${API_URL}/stories/generate`, taskData);
      return response.data;
    } catch (error) {
      console.error('Story generation failed:', error);
      throw error;
    }
  },

  getProjectStories: async (projectId) => {
    const response = await axios.get(`${API_URL}/stories/project/${projectId}`);
    return response.data;
  },

  getTeamStories: async (teamId) => {
    const response = await axios.get(`${API_URL}/stories/team/${teamId}`);
    return response.data;
  }
};

export default storyService;