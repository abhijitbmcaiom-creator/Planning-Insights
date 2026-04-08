# Planning Insights

A lightweight web application that lets you explore at-a-glance planning insights for any public GitHub repository.

## Features

- Enter a **GitHub username** and a **repository name** (or paste a full GitHub URL).
- Fetches live data from the GitHub API.
- Displays stars, forks, watchers, open issues, license, language, and topics.

## Usage

1. Open `index.html` in any modern browser (no build step required).
2. Fill in the **GitHub Username** field (e.g. `octocat`).
3. Fill in the **Repository Name or URL** field (e.g. `Hello-World` or `https://github.com/octocat/Hello-World`).
4. Click **Get Insights** to view the repository summary.

> **Note:** The app uses the unauthenticated GitHub API, which allows up to 60 requests per hour per IP address.

## Files

| File | Description |
|------|-------------|
| `index.html` | Main page with the input form |
| `style.css` | Styling for the page |
| `app.js` | JavaScript that calls the GitHub API and renders results |