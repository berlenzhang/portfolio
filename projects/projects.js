import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";


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

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let data = [
    { value: 1, label: 'apples' },
    { value: 2, label: 'oranges' },
    { value: 3, label: 'mangos' },
    { value: 4, label: 'pears' },
    { value: 5, label: 'limes' },
    { value: 5, label: 'cherries' },
  ];
let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcs = arcData.map(d => arcGenerator(d));


let colors = d3.scaleOrdinal(d3.schemeTableau10);

arcs.forEach((arc, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
})

let legend = d3.select('.legend');
data.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
})



