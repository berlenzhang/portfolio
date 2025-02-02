import { fetchJSON, renderProjects, fetchGitHubData } from '../global.js';

const projects = await fetchJSON('/projects/lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(latestProjects, projectsContainer, 'h2');




  
  
  