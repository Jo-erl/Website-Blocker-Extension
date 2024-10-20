let blockedSites = [];
let isInitialized = false;
const RULE_ID_START = 1;

// Initialize blocked sites
async function initialize() {
  if (isInitialized) return;
  const result = await chrome.storage.local.get(['blockedSites']);
  blockedSites = result.blockedSites || [];
  await updateBlockRules();
  isInitialized = true;
}

// Initialize when the extension loads
initialize();

// Update blocking rules
async function updateBlockRules() {
  try {
    // Remove existing rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: await chrome.declarativeNetRequest.getDynamicRules().then(rules => rules.map(rule => rule.id))
    });

    // Create new rules for each blocked site
    const rules = blockedSites.map((site, index) => ({
      id: RULE_ID_START + index,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          url: chrome.runtime.getURL("blocked.html")
        }
      },
      condition: {
        urlFilter: `*://*.${site}/*`,
        resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "media", "websocket"]
      }
    }));

    // Add subdomain rules
    const subdomainRules = blockedSites.map((site, index) => ({
      id: RULE_ID_START + blockedSites.length + index,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          url: chrome.runtime.getURL("blocked.html")
        }
      },
      condition: {
        urlFilter: `*://${site}/*`,
        resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "media", "websocket"]
      }
    }));

    // Add the rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [...rules, ...subdomainRules]
    });

  } catch (error) {
    console.error('Error updating blocking rules:', error);
  }
}

// Context menu setup
chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: "blockThisSite",
    title: "Block This Site",
    contexts: ["all"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "blockThisSite") {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname.replace('www.', '');
      
      // Get current blocked sites
      const result = await chrome.storage.local.get(['blockedSites']);
      const sites = result.blockedSites || [];
      
      // Add new site if not already blocked
      if (!sites.includes(domain)) {
        sites.push(domain);
        await chrome.storage.local.set({ blockedSites: sites });
        blockedSites = sites;
        
        // Update blocking rules
        await updateBlockRules();
        
        // Refresh the current tab
        chrome.tabs.reload(tab.id);
      }
    } catch (error) {
      console.error('Error blocking site:', error);
    }
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.blockedSites) {
    blockedSites = changes.blockedSites.newValue || [];
    await updateBlockRules();
  }
});