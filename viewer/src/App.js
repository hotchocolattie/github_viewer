import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

// Accent colors for repository language indicators.
const languageColors = {
  JavaScript: '#eab308',
  TypeScript: '#3b82f6',
  Rust: '#f97316',
  Python: '#22c55e',
  HTML: '#e34c26',
  CSS: '#563d7c',
  C: '#555555',
  'C++': '#f34b7d',
  Java: '#b07219',
  Go: '#00add8',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Shell: '#89e051',
  Dart: '#00b4ab',
  Vue: '#41b883',
  Scala: '#c22d40',
  R: '#198ce7',
};

function App() {
  // Form and table controls.
  const [username, setUsername] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('stars');
  const [activeUser, setActiveUser] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [requestStatus, setRequestStatus] = useState('idle');
  const [requestError, setRequestError] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [isMainHeaderCollapsed, setIsMainHeaderCollapsed] = useState(false);
  const [shouldAnimateHeader, setShouldAnimateHeader] = useState(false);
  const skipNextScrollUpdate = useRef(false);

  // Keep the compact shelf visible while the user browses repositories.
  useEffect(() => {
    const handleScroll = () => {
      if (skipNextScrollUpdate.current) {
        skipNextScrollUpdate.current = false;
        return;
      }

      setShouldAnimateHeader(false);
      setIsMainHeaderCollapsed(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter and sort the repositories displayed in the table.
  const visibleRepositories = useMemo(
    () => [...repositories]
      .filter((repository) => {
        const query = search.toLowerCase();

        return repository.name.toLowerCase().includes(query)
          || repository.description.toLowerCase().includes(query)
          || repository.language.toLowerCase().includes(query);
      })
      .sort((first, second) => (
        sortBy === 'name'
          ? first.name.localeCompare(second.name)
          : second.stars - first.stars
      )),
    [repositories, search, sortBy],
  );

  // Fetch and normalize public repositories for the submitted username.
  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) return;

    setActiveUser(trimmedUsername);
    setRepositories([]);
    setSearch('');
    setExpandedDescriptions({});
    setRequestError('');
    setRequestStatus('loading');

    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(trimmedUsername)}/repos?per_page=100&sort=updated`,
      );

      if (response.status === 404) {
        setRequestError('User Does Not Exist');
        setRequestStatus('error');
        return;
      }

      if (!response.ok) throw new Error('Unable to fetch repositories');

      const githubRepositories = await response.json();
      const normalizedRepositories = githubRepositories.map((repository) => ({
        name: repository.name,
        description: repository.description || 'No description provided.',
        language: repository.language || 'Not specified',
        stars: repository.stargazers_count,
        updated: new Date(repository.updated_at).toLocaleDateString(),
        url: repository.html_url,
      }));

      setRepositories(normalizedRepositories);
      setRequestStatus('success');
    } catch (error) {
      setRequestError('Unable to load repositories. Please try again.');
      setRequestStatus('error');
    }
  };

  // Toggle an individual repository description between collapsed and expanded states.
  const toggleDescription = (repositoryName) => {
    setExpandedDescriptions((currentDescriptions) => ({
      ...currentDescriptions,
      [repositoryName]: !currentDescriptions[repositoryName],
    }));
  };

  // Toggle the main header and username form shelf.
  const toggleMainHeader = () => {
    setShouldAnimateHeader(true);

    if (isMainHeaderCollapsed) {
      skipNextScrollUpdate.current = true;
      window.scrollTo(0, 0);
    }

    setIsMainHeaderCollapsed(!isMainHeaderCollapsed);
  };

  return (
    <div className="app-shell">

      <main>
        {/* Main header content and GitHub username form. */}
        <section
          className={`mainHeader ${isMainHeaderCollapsed ? 'is-collapsed' : ''} ${shouldAnimateHeader ? 'has-animation' : ''}`}
          id="main-header-panel"
          aria-labelledby="page-title"
        >
          <div className="mainHeaderContent">
            <h1 className="page-title">who are you looking for?</h1>
          </div>

          <form className="username-form" onSubmit={handleSubmit}>
            <label htmlFor="username">GitHub username</label>
            <div className="username-control">
              <span className="input-prefix">github.com /</span>
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username"
                aria-label="GitHub username"
              />
              <button type="submit">
                Explore <span aria-hidden="true">↗</span>
              </button>
            </div>
          </form>
        </section>

        {/* Main header collapse and expand control. */}
        <div className="header-toggle-row">
          <button
            className="header-toggle"
            type="button"
            aria-expanded={!isMainHeaderCollapsed}
            aria-controls="main-header-panel"
            aria-label={isMainHeaderCollapsed ? 'Expand main header' : 'Collapse main header'}
            onClick={toggleMainHeader}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>

        {/* repo heading, filters, and table. */}
        <section className="repository-section" aria-labelledby="repositories-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Showing repositories for</p>
              <h2 id="repositories-title">
                {requestStatus === 'success' ? (
                  <a
                    className="profile-link"
                    href={`https://github.com/${encodeURIComponent(activeUser)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{activeUser} <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <span>@{activeUser}</span>
                )}
              </h2>
            </div>
            <span className="repository-count">{visibleRepositories.length} repositories</span>
          </div>

          <div className="table-toolbar">
            <label className="search-control" htmlFor="repository-search">
              <span aria-hidden="true">⌕</span>
              <input
                id="repository-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search repositories"
              />
            </label>
            <label className="sort-control" htmlFor="sort-repositories">
              <span>Sort by</span>
              <select
                id="sort-repositories"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="stars">Most stars</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>
          </div>

          <div className="table-wrap">
            {requestStatus === 'loading' && (
              <div className="loading-state" role="status">
                <span className="loading-spinner" aria-hidden="true" />
                <span>Loading repositories</span>
              </div>
            )}

            {requestStatus === 'error' && (
              <p className="empty-state" role="alert">{requestError}</p>
            )}

            {requestStatus === 'idle' && (
              <p className="empty-state">Search a username to see repositories.</p>
            )}

            {requestStatus === 'success' && visibleRepositories.length === 0 && (
              <p className="empty-state">
                {search ? `No repositories match “${search}”.` : 'No public repositories found.'}
              </p>
            )}

            {requestStatus === 'success' && visibleRepositories.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Repository</th>
                    <th>Description</th>
                    <th>Language</th>
                    <th>Stars</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRepositories.map((repository) => (
                    <tr key={repository.name}>
                      <td>
                        <a
                          className="repository-name"
                          href={repository.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {repository.name} <span aria-hidden="true">↗</span>
                        </a>
                        <span className="updated">Updated {repository.updated}</span>
                      </td>
                      <td className="description">
                        <button
                          className={`description-toggle ${expandedDescriptions[repository.name] ? 'is-expanded' : ''}`}
                          type="button"
                          aria-expanded={Boolean(expandedDescriptions[repository.name])}
                          aria-label={`${expandedDescriptions[repository.name] ? 'Collapse' : 'Expand'} description for ${repository.name}`}
                          onClick={() => toggleDescription(repository.name)}
                        >
                          {repository.description}
                        </button>
                      </td>
                      <td>
                        <span className="language">
                          <i style={{ backgroundColor: languageColors[repository.language] || '#6a7772' }} />
                          {repository.language}
                        </span>
                      </td>
                      <td className="stars">
                        <span aria-hidden="true">★</span> {repository.stars.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
