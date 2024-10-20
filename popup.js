document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup loaded');

  const siteInput = document.getElementById('siteInput');
  const addButton = document.getElementById('addSite');
  const siteList = document.getElementById('siteList');

  if (!siteInput || !addButton || !siteList) {
      console.error('Required elements not found');
      return;
  }

  // Load existing blocked sites
  loadBlockedSites();

  // Add site button click handler
  addButton.addEventListener('click', function() {
      const site = siteInput.value.trim().toLowerCase();
      if (site) {
          addBlockedSite(site);
          siteInput.value = '';
      }
  });

  // Enter key handler
  siteInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
          const site = siteInput.value.trim().toLowerCase();
          if (site) {
              addBlockedSite(site);
              siteInput.value = '';
          }
      }
  });

  async function loadBlockedSites() {
      try {
          const result = await chrome.storage.local.get(['blockedSites']);
          const sites = result.blockedSites || [];
          displaySites(sites);
      } catch (error) {
          console.error('Error loading sites:', error);
      }
  }

  async function addBlockedSite(site) {
      try {
          // Remove any http://, https://, or www. from the input
          site = site.replace(/^(https?:\/\/)?(www\.)?/, '');
          
          const result = await chrome.storage.local.get(['blockedSites']);
          const sites = result.blockedSites || [];
          if (!sites.includes(site)) {
              sites.push(site);
              await chrome.storage.local.set({ blockedSites: sites });
              displaySites(sites);
          }
      } catch (error) {
          console.error('Error adding site:', error);
      }
  }

  async function removeSite(site) {
      try {
          const result = await chrome.storage.local.get(['blockedSites']);
          const sites = result.blockedSites || [];
          const newSites = sites.filter(s => s !== site);
          await chrome.storage.local.set({ blockedSites: newSites });
          displaySites(newSites);
      } catch (error) {
          console.error('Error removing site:', error);
      }
  }

  function displaySites(sites) {
      siteList.innerHTML = '';
      if (sites.length === 0) {
          siteList.innerHTML = '<p style="text-align: center; color: #666;">No sites blocked yet</p>';
          return;
      }
      
      sites.sort().forEach(site => {
          const div = document.createElement('div');
          div.className = 'site-item';
          div.innerHTML = `
              <span>${site}</span>
              <button class="remove" data-site="${site}">Remove</button>
          `;
          siteList.appendChild(div);
      });

      // Add remove button listeners
      document.querySelectorAll('.remove').forEach(button => {
          button.addEventListener('click', (e) => {
              removeSite(e.target.dataset.site);
          });
      });
  }
});