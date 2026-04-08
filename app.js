/**
 * app.js — Planning Insights
 * Fetches repository data from the GitHub API and renders planning insights.
 */

(function () {
  'use strict';

  const form = document.getElementById('insightsForm');
  const usernameInput = document.getElementById('username');
  const repoInput = document.getElementById('repo');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('error');
  const resultsBox = document.getElementById('results');

  /**
   * Parse a raw input that may be a full GitHub URL or just a repo name.
   * Returns the bare repo name (e.g. "my-repo").
   */
  function parseRepoName(raw) {
    const trimmed = raw.trim();
    // Handle full GitHub URLs: https://github.com/user/repo  or  github.com/user/repo
    const urlMatch = trimmed.match(/github\.com\/[^/]+\/([^/?\s#]+)/i);
    if (urlMatch) {
      return urlMatch[1].replace(/\.git$/, '');
    }
    // Otherwise treat the whole input as the repo name
    return trimmed.replace(/\.git$/, '');
  }

  /**
   * Parse a full GitHub URL to extract the owner username embedded in the URL,
   * overriding the username field when a full URL is provided.
   */
  function parseOwnerFromUrl(raw) {
    const trimmed = raw.trim();
    const urlMatch = trimmed.match(/github\.com\/([^/?\s#]+)\/([^/?\s#]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
    return null;
  }

  /**
   * Format large numbers with k/M suffixes.
   */
  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  /**
   * Show an error message.
   */
  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
    resultsBox.classList.add('hidden');
  }

  /**
   * Hide any previous error or results.
   */
  function clearOutput() {
    errorBox.classList.add('hidden');
    resultsBox.classList.add('hidden');
    resultsBox.innerHTML = '';
  }

  /**
   * Render the repository insights into the results box.
   */
  function renderResults(data) {
    const updatedAt = new Date(data.updated_at).toLocaleDateString(navigator.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const langTag = data.language
      ? `<span class="tag lang">${escapeHtml(data.language)}</span>`
      : '';

    const topicTags = (data.topics || [])
      .slice(0, 8)
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join('');

    const topicsSection =
      topicTags || langTag
        ? `<div class="tag-row">${langTag}${topicTags}</div>`
        : '';

    const description = data.description
      ? `<p class="description">${escapeHtml(data.description)}</p>`
      : '';

    resultsBox.innerHTML = `
      <div class="repo-header">
        <img src="${escapeHtml(safeAvatarUrl(data.owner.avatar_url) + '&s=96')}" alt="${escapeHtml(data.owner.login)} avatar" />
        <div>
          <div class="repo-title">
            <a href="${escapeHtml(safeGitHubUrl(data.html_url))}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(data.full_name)}
            </a>
          </div>
          <small class="repo-updated">Last updated: ${updatedAt}</small>
        </div>
      </div>
      ${description}
      ${topicsSection}
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">⭐ ${formatNumber(data.stargazers_count)}</div>
          <div class="stat-label">Stars</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">🍴 ${formatNumber(data.forks_count)}</div>
          <div class="stat-label">Forks</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">👁 ${formatNumber(data.watchers_count)}</div>
          <div class="stat-label">Watchers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">🐛 ${formatNumber(data.open_issues_count)}</div>
          <div class="stat-label">Open Issues</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.private ? '🔒' : '🌐'}</div>
          <div class="stat-label">${data.private ? 'Private' : 'Public'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.license ? escapeHtml(data.license.spdx_id) : '—'}</div>
          <div class="stat-label">License</div>
        </div>
      </div>
    `;

    resultsBox.classList.remove('hidden');
  }

  /**
   * Return a safe avatar URL — must come from GitHub's CDN.
   * Falls back to an empty string on unexpected origins.
   * Returns the raw (unescaped) URL so callers can build the full URL before
   * passing it through escapeHtml.
   */
  function safeAvatarUrl(raw) {
    try {
      const url = new URL(raw);
      if (
        url.protocol === 'https:' &&
        url.hostname === 'avatars.githubusercontent.com'
      ) {
        return raw;
      }
    } catch (_) { /* ignore */ }
    return '';
  }

  /**
   * Return a safe html_url — must be an https://github.com link.
   * Falls back to '#' on unexpected values.
   * Returns the raw (unescaped) URL so callers can escape it after building.
   */
  function safeGitHubUrl(raw) {
    try {
      const url = new URL(raw);
      if (
        url.protocol === 'https:' &&
        url.hostname === 'github.com'
      ) {
        return raw;
      }
    } catch (_) { /* ignore */ }
    return '#';
  }

  /**
   * Simple HTML escaping to prevent XSS.
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearOutput();

    const rawRepo = repoInput.value;
    const ownerFromUrl = parseOwnerFromUrl(rawRepo);
    const owner = ownerFromUrl || usernameInput.value.trim();
    const repoName = parseRepoName(rawRepo);

    if (!owner) {
      showError('Please enter a GitHub username.');
      return;
    }
    if (!repoName) {
      showError('Please enter a repository name or URL.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading…';

    try {
      const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`;
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/vnd.github+json' },
      });

      if (response.status === 404) {
        showError(`Repository "${owner}/${repoName}" was not found. Check the username and repo name and try again.`);
        return;
      }

      if (response.status === 403) {
        showError('GitHub API rate limit reached. Please wait a moment and try again.');
        return;
      }

      if (!response.ok) {
        showError(`GitHub API returned an error (HTTP ${response.status}). Please try again.`);
        return;
      }

      const data = await response.json();
      renderResults(data);
    } catch (err) {
      showError('Unable to reach the GitHub API. Please check your internet connection and try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Get Insights';
    }
  });
})();
