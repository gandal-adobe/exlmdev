import { htmlToElement, moveInstrumentation, decorateExternalLinks } from '../../scripts/scripts.js';
import { defaultProfileClient } from '../../scripts/auth/profile.js';
import { loadBlocks, decorateSections, decorateBlocks, decorateIcons } from '../../scripts/lib-franklin.js';

// Will be refactoring this function to use a loadFragment() function from scripts.js
const fetchPageContent = async (url, loader, block) => {
  try {
    const response = await fetch(`${url}.plain.html`);
    if (response.ok) {
      const pageContent = await response.text();
      const container = document.createElement('div');
      container.innerHTML = pageContent;
      decorateSections(container);
      decorateBlocks(container);
      decorateExternalLinks(container);
      await loadBlocks(container);
      await decorateIcons(container);
      if (window.hlx.aemRoot) {
        loader.insertAdjacentElement('beforebegin', container);
        moveInstrumentation(block, container);
      } else {
        Array.from(container.children).forEach((section) => {
          loader.insertAdjacentElement('beforebegin', section);
        });
      }
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log(err);
  }
};

export default async function decorate(block) {
  let [completePageURL, incompletePageURL] = [...block.children].map((row) => row.querySelector('a')?.href);
  document.body.classList.add('profile-home-page');
  document.body.appendChild(
    htmlToElement('<div class="profile-background" role="presentation" aria-hidden="true"></div>'),
  );
  if (completePageURL && incompletePageURL) {
    if (window.hlx.aemRoot) {
      completePageURL = completePageURL.replace('.html', '');
      incompletePageURL = incompletePageURL.replace('.html', '');
    }
    block.textContent = 'This block will load content authored based on if the profile is completed or incomplete';
    const currentSection = block.parentElement.parentElement;
    const loader = htmlToElement('<div class="section profile-shimmer"><span></span></div>');
    currentSection.insertAdjacentElement('beforebegin', loader);
    const profileData = await defaultProfileClient.getMergedProfile();
    if (profileData?.interests.length) {
      await fetchPageContent(completePageURL, currentSection, block);
    } else {
      await fetchPageContent(incompletePageURL, currentSection, block);
    }
    loader.remove();
    currentSection.remove();
  }
}