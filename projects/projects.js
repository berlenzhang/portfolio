import { fetchJSON, renderProjects } from '../global.js';

console.log('Fetching projects...');
const projects = await fetchJSON('./lib/projects.json');
console.log('Fetched projects:', projects);

const projectsContainer = document.querySelector('.projects');

if (projects && projects.length > 0) {
    renderProjects(projects, projectsContainer, 'h2');
    updateProjectCount(projects);
} else {
    console.error('No projects found or failed to load projects.');
    projectsContainer.innerHTML = '<p>Failed to load projects.</p>';
}

function updateProjectCount(projects) {
    const titleElement = document.querySelector('.projects-title');
    titleElement.textContent = `${projects.length} Projects`;
}


