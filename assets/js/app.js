
let albums = [];
let currentSort = { field: 'artist', order: 'asc' };

const albumGrid = document.getElementById('album-grid');
const searchInput = document.getElementById('search-input');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalFooter = document.getElementById('modal-footer');
const backToTopBtn = document.getElementById('back-to-top');
const albumCountEl = document.getElementById('album-count');

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadAlbums();
    setupEventListeners();
    setupBackToTop();
}

async function loadAlbums() {
    try {
        showLoading();
        const response = await fetch('assets/data/library.json');
        if (!response.ok) throw new Error('Failed to load albums');
        albums = await response.json();
        sortAlbums('artist', 'asc');
        renderAlbums(albums);
    } catch (error) {
        console.error('Error loading albums:', error);
        showError('Failed to load albums. Please try again later.');
    }
}

function showLoading() {
    albumGrid.innerHTML = `
        <div class="col-12 loading-spinner">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

function showError(message) {
    albumGrid.innerHTML = `
        <div class="col-12 text-center text-danger py-5">
            <p>${message}</p>
        </div>
    `;
}

function renderAlbums(albumsToRender) {
    if (albumsToRender.length === 0) {
        albumGrid.innerHTML = `
            <div class="col-12 no-results">
                <div class="no-results-icon">&#128269;</div>
                <h4>No albums found</h4>
                <p>Try adjusting your search terms</p>
            </div>
        `;
        updateAlbumCount(0);
        return;
    }

    albumGrid.innerHTML = albumsToRender.map(album => createAlbumCard(album)).join('');
    updateAlbumCount(albumsToRender.length);
}

function createAlbumCard(album) {
    return `
        <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12 mb-4 album-column" data-album-id="${album.id}">
            <div class="card album-card card-equal-height h-100">
                <div class="card-img-container">
                    <img src="assets/img/${album.thumbnail}" class="card-img-top" alt="${album.album} cover">
                    <div class="card-img-overlay-custom">${album.album}</div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${album.artist}</h5>
                    <p class="card-text text-muted">${album.album}</p>
                </div>
                <div class="card-footer bg-transparent border-top">
                    <button type="button" class="btn btn-primary btn-sm w-100 view-tracklist-btn"
                            data-album-id="${album.id}"
                            data-bs-toggle="modal"
                            data-bs-target="#tracklistModal">
                        View Tracklist
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updateAlbumCount(count) {
    if (albumCountEl) {
        albumCountEl.textContent = `${count} album${count !== 1 ? 's' : ''}`;
    }
}

function setupEventListeners() {
    albumGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-tracklist-btn');
        if (btn) {
            const albumId = parseInt(btn.dataset.albumId);
            const album = albums.find(a => a.id === albumId);
            if (album) {
                populateModal(album);
            }
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', handleSort);
    });
}

function populateModal(album) {
    modalTitle.textContent = `${album.artist} - ${album.album}`;

    const stats = calculateAlbumStats(album.tracklist);

    modalBody.innerHTML = `
        <!-- Statistics Section -->
        <div class="stats-section mb-3">
            <div class="row">
                <div class="col-6 col-md-3 stat-item">
                    <div class="stat-value">${stats.totalTracks}</div>
                    <div class="stat-label">Tracks</div>
                </div>
                <div class="col-6 col-md-3 stat-item">
                    <div class="stat-value">${stats.totalDuration}</div>
                    <div class="stat-label">Total Time</div>
                </div>
                <div class="col-6 col-md-3 stat-item">
                    <div class="stat-value">${stats.avgLength}</div>
                    <div class="stat-label">Avg Length</div>
                </div>
                <div class="col-6 col-md-3 stat-item">
                    <div class="stat-value">${stats.longestTrack.length}</div>
                    <div class="stat-label">Longest</div>
                </div>
            </div>
            <div class="text-center mt-2 small text-muted">
                <span>Longest: "${stats.longestTrack.title}" | Shortest: "${stats.shortestTrack.title}" (${stats.shortestTrack.length})</span>
            </div>
        </div>

        <!-- Tracklist Table -->
        <div class="table-responsive">
            <table class="table table-hover tracklist-table mb-0">
                <thead>
                    <tr>
                        <th class="track-number">#</th>
                        <th>Title</th>
                        <th class="track-length">Length</th>
                    </tr>
                </thead>
                <tbody>
                    ${album.tracklist.map(track => `
                        <tr>
                            <td class="track-number">${track.number}</td>
                            <td>
                                <a href="${track.url}" target="_blank" rel="noopener noreferrer"
                                   class="track-link" title="Listen on Spotify">
                                    ${track.title}
                                </a>
                            </td>
                            <td class="track-length">${track.trackLength}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    const firstTrackUrl = album.tracklist[0]?.url || '#';
    modalFooter.innerHTML = `
        <a href="${firstTrackUrl}" target="_blank" rel="noopener noreferrer"
           class="btn btn-spotify">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-spotify me-1" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.5.5 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288"/>
            </svg>
            Play on Spotify
        </a>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close Tracklist</button>
    `;
}

function calculateAlbumStats(tracklist) {
    let totalSeconds = 0;
    let longestTrack = { title: '', seconds: 0, length: '0:00' };
    let shortestTrack = { title: '', seconds: Infinity, length: '0:00' };

    tracklist.forEach(track => {
        const seconds = parseTrackLength(track.trackLength);
        totalSeconds += seconds;

        if (seconds > longestTrack.seconds) {
            longestTrack = { title: track.title, seconds, length: track.trackLength };
        }
        if (seconds < shortestTrack.seconds) {
            shortestTrack = { title: track.title, seconds, length: track.trackLength };
        }
    });

    const avgSeconds = Math.round(totalSeconds / tracklist.length);

    return {
        totalTracks: tracklist.length,
        totalDuration: formatDuration(totalSeconds),
        avgLength: formatDuration(avgSeconds),
        longestTrack,
        shortestTrack
    };
}

function parseTrackLength(timeStr) {
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (!searchTerm) {
        renderAlbums(albums);
        return;
    }

    const filteredAlbums = albums.filter(album =>
        album.artist.toLowerCase().includes(searchTerm) ||
        album.album.toLowerCase().includes(searchTerm)
    );

    renderAlbums(filteredAlbums);
}

function handleSort(e) {
    const btn = e.currentTarget;
    const field = btn.dataset.sortField;
    let order = btn.dataset.sortOrder || 'asc';

    if (currentSort.field === field) {
        order = currentSort.order === 'asc' ? 'desc' : 'asc';
    }

    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    btn.dataset.sortOrder = order;

    sortAlbums(field, order);
    renderAlbums(albums);
}

function sortAlbums(field, order) {
    currentSort = { field, order };

    albums.sort((a, b) => {
        let valueA, valueB;

        switch (field) {
            case 'artist':
                valueA = a.artist.toLowerCase();
                valueB = b.artist.toLowerCase();
                break;
            case 'album':
                valueA = a.album.toLowerCase();
                valueB = b.album.toLowerCase();
                break;
            case 'tracks':
                valueA = a.tracklist.length;
                valueB = b.tracklist.length;
                break;
            default:
                return 0;
        }

        if (typeof valueA === 'string') {
            const comparison = valueA.localeCompare(valueB);
            return order === 'asc' ? comparison : -comparison;
        } else {
            return order === 'asc' ? valueA - valueB : valueB - valueA;
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupBackToTop() {
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
