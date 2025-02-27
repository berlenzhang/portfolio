console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const navLinks = $$("nav a");

let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
  );

if (currentLink) {
    currentLink.classList.add('current');
}

let pages = [
    { url: '', title: 'Home' },
    { url: '../projects/', title: 'Projects' },
    { url: '../resume/', title: 'Resume' },
    { url: 'https://github.com/berlenzhang/', title: 'Profile' },
    { url: '../meta/', title: 'Meta' },
    { url: '../contact/', title: 'Contact' },
  ];

let nav = document.createElement('nav');
document.body.prepend(nav);

const ARE_WE_HOME = document.documentElement.classList.contains('home');


for (let p of pages) {
    let url = p.url;
    let title = p.title;

    if (!ARE_WE_HOME && !url.startsWith('http')) {
      url = '../' + url;
      }

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname) {
      a.classList.add('current');
      }

    if (a.host !== location.host) {
      a.target = '_blank';
      }

    nav.append(a);
    }

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">Theme:
    <select id="theme-switch">
      <option value="auto" selected>Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
  );

const select = document.querySelector('.color-scheme select');
    
select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
  localStorage.colorScheme = event.target.value
});

document.addEventListener('DOMContentLoaded', () => {
  if ('colorScheme' in localStorage) {
    const savedScheme = localStorage.colorScheme;

    document.documentElement.style.setProperty('color-scheme', savedScheme);

    const select = document.querySelector('.color-scheme select');
    select.value = savedScheme;
  }
});

export async function fetchJSON(url) {
  try {
      const response = await fetch(url);

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data;
  } catch (error) {
      console.error(`Error fetching or parsing JSON from ${url}:`, error);
      return null;
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';

  projects.forEach(project => {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image || 'placeholder.jpg'}" alt="${project.title}">
      <div class="project-details">
        <p>${project.description}</p>
        <p class="project-year">c. ${project.year}</p>
      </div>
    `;

    containerElement.appendChild(article);
  });
}



export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

