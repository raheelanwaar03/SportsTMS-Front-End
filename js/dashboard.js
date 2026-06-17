import {
    ANNOUNCEMENTS_API,
    MATCH_API,
    STANDINGS_API,
    TEAM_API,
    TOURNAMENT_API,
    buildUrl,
    clearAuthSession,
    getApiErrorMessage,
    getAuthToken,
    getCurrentUser,
    normalizeCollection,
    requestJson
} from './ApiServices.js';

document.addEventListener('DOMContentLoaded', () => {
    const authToken = getAuthToken();
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    const state = {
        currentSection: 'tournaments',
        user: getCurrentUser(),
        tournaments: [],
        teams: [],
        matches: [],
        announcements: [],
        loadErrors: []
    };

    const els = {
        navLinks: document.querySelectorAll('.nav-link[data-section]'),
        sections: document.querySelectorAll('.dashboard-section'),
        logoutButton: document.getElementById('logoutButton'),
        alertPlaceholder: document.getElementById('alertPlaceholder'),
        pageTitle: document.getElementById('pageTitle'),
        pageSubtitle: document.getElementById('pageSubtitle'),
        userName: document.getElementById('userName'),
        tournamentCount: document.getElementById('tournamentCount'),
        teamCount: document.getElementById('teamCount'),
        matchCount: document.getElementById('matchCount'),
        announcementCount: document.getElementById('announcementCount'),
        tournamentList: document.getElementById('tournamentList'),
        teamList: document.getElementById('teamList'),
        matchTableBody: document.getElementById('matchTableBody'),
        standingsTableBody: document.getElementById('standingsTableBody'),
        announcementList: document.getElementById('announcementList'),
        standingTournamentSelect: document.getElementById('standingTournamentSelect'),
        matchTournament: document.getElementById('matchTournament')
    };

    init();

    async function init() {
        setupUserDisplay();
        setupNavigation();
        setupForms();
        applyRoleRestrictions();
        await loadDashboardData();
        renderActiveSection();
    }

    function setupUserDisplay() {
        const role = getRole();
        const name = state.user?.username || state.user?.name || state.user?.email || 'User';
        els.userName.textContent = `${name} (${formatRole(role)})`;
    }

    function setupNavigation() {
        els.navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                state.currentSection = link.dataset.section;
                els.navLinks.forEach((item) => item.classList.toggle('active', item === link));
                renderActiveSection();
            });
        });

        els.logoutButton.addEventListener('click', () => {
            clearAuthSession();
            window.location.href = 'login.html';
        });
    }

    function setupForms() {
        document.getElementById('tournamentForm').addEventListener('submit', handleTournamentSubmit);
        document.getElementById('teamForm').addEventListener('submit', handleTeamSubmit);
        document.getElementById('matchForm').addEventListener('submit', handleMatchSubmit);
        document.getElementById('announcementForm').addEventListener('submit', handleAnnouncementSubmit);

        document.getElementById('tournamentModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('tournamentForm').reset();
            document.getElementById('tournamentId').value = '';
            document.getElementById('tournamentModalTitle').textContent = 'Tournament Details';
        });

        document.getElementById('teamModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('teamForm').reset();
            document.getElementById('teamId').value = '';
        });

        els.standingTournamentSelect.addEventListener('change', (event) => {
            loadStandings(event.target.value);
        });

        els.matchTournament.addEventListener('change', () => {
            populateTeamSelects();
        });

        document.addEventListener('click', (event) => {
            const button = event.target.closest('[data-action]');
            if (!button) return;

            const { action, id } = button.dataset;
            if (action === 'edit-tournament') editTournament(id);
            if (action === 'delete-tournament') deleteTournament(id);
            if (action === 'delete-team') deleteTeam(id);
        });
    }

    async function loadDashboardData() {
        state.loadErrors = [];

        const tasks = [
            { label: 'tournaments', loader: loadTournaments },
            { label: 'teams', loader: loadTeams },
            { label: 'matches', loader: loadMatches },
            { label: 'announcements', loader: loadAnnouncements }
        ];

        const results = await Promise.allSettled(tasks.map((task) => task.loader()));

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                state.loadErrors.push(tasks[index].label);
                console.warn(`Failed to load ${tasks[index].label}:`, result.reason);
            }
        });

        populateTournamentSelects();
        populateTeamSelects();
        renderStats();

        if (state.loadErrors.length === tasks.length) {
            showAlert('No service data could be loaded. Please check that the tournament services are running.', 'danger');
        } else if (state.loadErrors.length > 0) {
            showAlert(`Some service data could not be loaded: ${state.loadErrors.join(', ')}.`, 'warning');
        }
    }

    async function loadTournaments() {
        const data = await requestJson(`${TOURNAMENT_API.BASE_URL}${TOURNAMENT_API.GET_ALL_TOURNAMENTS}`);
        state.tournaments = normalizeCollection(data);
    }

    async function loadTeams() {
        const data = await requestJson(`${TEAM_API.BASE_URL}${TEAM_API.GET_ALL_TEAMS}`);
        state.teams = normalizeCollection(data);
    }

    async function loadMatches() {
        const data = await requestJson(`${MATCH_API.BASE_URL}${MATCH_API.GET_ALL_MATCHES}`);
        state.matches = normalizeCollection(data);
    }

    async function loadAnnouncements() {
        const data = await requestJson(`${ANNOUNCEMENTS_API.BASE_URL}${ANNOUNCEMENTS_API.GET_ALL_ANNOUNCEMENTS}`);
        state.announcements = normalizeCollection(data);
    }

    function renderActiveSection() {
        els.sections.forEach((section) => {
            const isActive = section.id === `${state.currentSection}Section`;
            section.classList.toggle('d-none', !isActive);

            if (isActive) {
                els.pageTitle.textContent = section.dataset.title || 'Dashboard';
                els.pageSubtitle.textContent = section.dataset.subtitle || '';
            }
        });

        if (state.currentSection === 'tournaments') renderTournaments();
        if (state.currentSection === 'teams') renderTeams();
        if (state.currentSection === 'matches') renderMatches();
        if (state.currentSection === 'standings') renderStandingsSection();
        if (state.currentSection === 'announcements') renderAnnouncements();
    }

    function renderStats() {
        els.tournamentCount.textContent = state.tournaments.length;
        els.teamCount.textContent = state.teams.length;
        els.matchCount.textContent = state.matches.length;
        els.announcementCount.textContent = state.announcements.length;
    }

    function renderTournaments() {
        if (!state.tournaments.length) {
            els.tournamentList.innerHTML = emptyState('bi-trophy', 'No tournaments found.', 'Tournament records will appear here.');
            return;
        }

        els.tournamentList.innerHTML = state.tournaments.map((tournament) => {
            const id = getEntityId(tournament);
            const canManage = canManageTournaments();
            const description = tournament.description || 'No description provided.';
            const dateRange = `${formatDate(tournament.startDate)} to ${formatDate(tournament.endDate)}`;

            return `
                <article class="entity-card">
                    <div class="entity-card-header">
                        <div>
                            <span class="badge-soft">${escapeHtml(tournament.sportType || 'Sport')}</span>
                            <h3 class="mt-2">${escapeHtml(tournament.name || 'Untitled tournament')}</h3>
                        </div>
                    </div>
                    <p>${escapeHtml(description)}</p>
                    <div class="entity-card-footer">
                        <span class="meta-line">${escapeHtml(dateRange)}</span>
                        ${canManage ? `
                            <span class="card-actions">
                                <button class="btn btn-sm btn-outline-primary" type="button" data-action="edit-tournament" data-id="${escapeHtml(id)}" title="Edit tournament">
                                    <i class="bi bi-pencil"></i>
                                    <span class="visually-hidden">Edit tournament</span>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" type="button" data-action="delete-tournament" data-id="${escapeHtml(id)}" title="Delete tournament">
                                    <i class="bi bi-trash"></i>
                                    <span class="visually-hidden">Delete tournament</span>
                                </button>
                            </span>
                        ` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    function renderTeams() {
        if (!state.teams.length) {
            els.teamList.innerHTML = emptyState('bi-people', 'No teams found.', 'Registered teams will appear here.');
            return;
        }

        els.teamList.innerHTML = state.teams.map((team) => {
            const id = getEntityId(team);
            const canManage = canManageTeams();
            const tournamentId = getTournamentId(team);

            return `
                <article class="entity-card">
                    <div class="entity-card-header">
                        <div>
                            <span class="badge-soft">${escapeHtml(getTournamentName(tournamentId))}</span>
                            <h3 class="mt-2">${escapeHtml(getTeamName(team))}</h3>
                        </div>
                    </div>
                    <p>Captain ID: ${escapeHtml(team.captainId || team.captain || 'N/A')}</p>
                    <div class="entity-card-footer">
                        <span class="meta-line">Team ID: ${escapeHtml(id || 'N/A')}</span>
                        ${canManage && id ? `
                            <button class="btn btn-sm btn-outline-danger" type="button" data-action="delete-team" data-id="${escapeHtml(id)}" title="Delete team">
                                <i class="bi bi-trash"></i>
                                <span class="visually-hidden">Delete team</span>
                            </button>
                        ` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    function renderMatches() {
        if (!state.matches.length) {
            els.matchTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No matches found.</td></tr>';
            return;
        }

        els.matchTableBody.innerHTML = state.matches.map((match) => {
            const tournamentName = getTournamentName(match.tournamentId || match.tournament?._id || match.tournament?.id);
            const teamA = getTeamNameById(match.teamAId || match.teamA?._id || match.teamA?.id) || match.teamA || 'Team A';
            const teamB = getTeamNameById(match.teamBId || match.teamB?._id || match.teamB?.id) || match.teamB || 'Team B';
            const result = formatMatchResult(match);

            return `
                <tr>
                    <td>${escapeHtml(formatDateTime(match.date || match.matchDate))}</td>
                    <td>${escapeHtml(tournamentName)}</td>
                    <td>${escapeHtml(teamA)}</td>
                    <td>${escapeHtml(teamB)}</td>
                    <td>${escapeHtml(match.venue || 'N/A')}</td>
                    <td>${escapeHtml(result)}</td>
                </tr>
            `;
        }).join('');
    }

    function renderStandingsSection() {
        populateTournamentSelects();
        const selectedTournament = els.standingTournamentSelect.value || getEntityId(state.tournaments[0]);

        if (selectedTournament) {
            els.standingTournamentSelect.value = selectedTournament;
            loadStandings(selectedTournament);
            return;
        }

        els.standingsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No tournaments available.</td></tr>';
    }

    async function loadStandings(tournamentId) {
        if (!tournamentId) {
            els.standingsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Select a tournament.</td></tr>';
            return;
        }

        els.standingsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Loading standings...</td></tr>';

        try {
            const data = await requestJson(buildUrl(STANDINGS_API.BASE_URL, STANDINGS_API.GET_TOURNAMENT_STANDINGS, { tournamentId }));
            renderStandings(normalizeCollection(data));
        } catch (error) {
            els.standingsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Standings unavailable.</td></tr>';
            showAlert(getApiErrorMessage(error, 'Failed to load standings.'), 'danger');
        }
    }

    function renderStandings(standings) {
        if (!standings.length) {
            els.standingsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No standings found.</td></tr>';
            return;
        }

        els.standingsTableBody.innerHTML = standings
            .sort((a, b) => Number(b.points || 0) - Number(a.points || 0))
            .map((standing, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(standing.teamName || getTeamNameById(standing.teamId) || standing.teamId || 'Team')}</td>
                    <td>${escapeHtml(standing.played || standing.matchesPlayed || 0)}</td>
                    <td>${escapeHtml(standing.won || standing.wins || 0)}</td>
                    <td>${escapeHtml(standing.lost || standing.losses || 0)}</td>
                    <td><strong>${escapeHtml(standing.points || 0)}</strong></td>
                </tr>
            `).join('');
    }

    function renderAnnouncements() {
        if (!state.announcements.length) {
            els.announcementList.innerHTML = emptyState('bi-megaphone', 'No announcements found.', 'Published updates will appear here.');
            return;
        }

        els.announcementList.innerHTML = state.announcements.map((announcement) => `
            <article class="announcement-item">
                <div class="entity-card-header">
                    <h3>${escapeHtml(announcement.title || 'Untitled announcement')}</h3>
                    <span class="meta-line">${escapeHtml(formatDate(announcement.createdAt || announcement.date))}</span>
                </div>
                <p>${escapeHtml(announcement.content || '')}</p>
                <span class="meta-line">Author ID: ${escapeHtml(announcement.authorId || 'N/A')}</span>
            </article>
        `).join('');
    }

    async function handleTournamentSubmit(event) {
        event.preventDefault();

        const id = document.getElementById('tournamentId').value;
        const data = {
            name: document.getElementById('tournamentName').value.trim(),
            sportType: document.getElementById('tournamentSportType').value.trim(),
            startDate: toIsoDateTime(document.getElementById('tournamentStartDate').value),
            endDate: toIsoDateTime(document.getElementById('tournamentEndDate').value),
            description: document.getElementById('tournamentDescription').value.trim(),
            organizerId: state.user?.id || state.user?._id || '13'
        };

        if (!data.name || !data.sportType || !data.startDate || !data.endDate) {
            showAlert('Please complete the required tournament fields.', 'danger');
            return;
        }

        try {
            const path = id ? buildUrl(TOURNAMENT_API.BASE_URL, TOURNAMENT_API.UPDATE_TOURNAMENT, { id }) : `${TOURNAMENT_API.BASE_URL}${TOURNAMENT_API.CREATE_TOURNAMENT}`;
            await requestJson(path, { method: id ? 'PUT' : 'POST', body: data });
            closeModal('tournamentModal');
            showAlert(id ? 'Tournament updated.' : 'Tournament created.', 'success');
            await loadTournaments();
            populateTournamentSelects();
            renderStats();
            renderTournaments();
        } catch (error) {
            showAlert(getApiErrorMessage(error, 'Tournament could not be saved.'), 'danger');
        }
    }

    async function handleTeamSubmit(event) {
        event.preventDefault();

        const data = {
            teamName: document.getElementById('teamName').value.trim(),
            tournamentId: document.getElementById('teamTournament').value,
            captainId: document.getElementById('teamCaptain').value.trim()
        };

        if (!data.teamName || !data.tournamentId || !data.captainId) {
            showAlert('Please complete the required team fields.', 'danger');
            return;
        }

        try {
            await requestJson(`${TEAM_API.BASE_URL}${TEAM_API.REGISTER_TEAM}`, { method: 'POST', body: data });
            closeModal('teamModal');
            showAlert('Team registered.', 'success');
            await loadTeams();
            populateTeamSelects();
            renderStats();
            renderTeams();
        } catch (error) {
            showAlert(getApiErrorMessage(error, 'Team could not be registered.'), 'danger');
        }
    }

    async function handleMatchSubmit(event) {
        event.preventDefault();

        const teamAId = document.getElementById('matchTeamA').value;
        const teamBId = document.getElementById('matchTeamB').value;

        if (teamAId === teamBId) {
            showAlert('Choose two different teams for the match.', 'danger');
            return;
        }

        const data = {
            teamAId,
            teamBId,
            date: toIsoDateTime(document.getElementById('matchDate').value),
            venue: document.getElementById('matchVenue').value.trim()
        };

        if (!data.teamAId || !data.teamBId || !data.date || !data.venue) {
            showAlert('Please complete the required match fields.', 'danger');
            return;
        }

        try {
            await requestJson(`${MATCH_API.BASE_URL}${MATCH_API.SCHEDULE_MATCH}`, { method: 'POST', body: data });
            closeModal('matchModal');
            showAlert('Match scheduled.', 'success');
            await loadMatches();
            renderStats();
            renderMatches();
        } catch (error) {
            showAlert(getApiErrorMessage(error, 'Match could not be scheduled.'), 'danger');
        }
    }

    async function handleAnnouncementSubmit(event) {
        event.preventDefault();

        const data = {
            title: document.getElementById('announcementTitle').value.trim(),
            content: document.getElementById('announcementContent').value.trim(),
            authorId: state.user?.id || state.user?._id || '69ee07ee9da0a61d87d2c4e1'
        };

        if (!data.title || !data.content) {
            showAlert('Please complete the announcement fields.', 'danger');
            return;
        }

        try {
            await requestJson(`${ANNOUNCEMENTS_API.BASE_URL}${ANNOUNCEMENTS_API.CREATE_ANNOUNCEMENT}`, { method: 'POST', body: data });
            closeModal('announcementModal');
            showAlert('Announcement posted.', 'success');
            await loadAnnouncements();
            renderStats();
            renderAnnouncements();
        } catch (error) {
            showAlert(getApiErrorMessage(error, 'Announcement could not be posted.'), 'danger');
        }
    }

    function editTournament(id) {
        const tournament = state.tournaments.find((item) => getEntityId(item) === id);
        if (!tournament) return;

        document.getElementById('tournamentModalTitle').textContent = 'Edit Tournament';
        document.getElementById('tournamentId').value = id;
        document.getElementById('tournamentName').value = tournament.name || '';
        document.getElementById('tournamentSportType').value = tournament.sportType || '';
        document.getElementById('tournamentStartDate').value = toDateTimeLocal(tournament.startDate);
        document.getElementById('tournamentEndDate').value = toDateTimeLocal(tournament.endDate);
        document.getElementById('tournamentDescription').value = tournament.description || '';

        window.bootstrap.Modal.getOrCreateInstance(document.getElementById('tournamentModal')).show();
    }

    async function deleteTournament(id) {
        if (!id || !window.confirm('Delete this tournament?')) return;

        try {
            await requestJson(buildUrl(TOURNAMENT_API.BASE_URL, TOURNAMENT_API.DELETE_TOURNAMENT, { id }), { method: 'DELETE' });
            showAlert('Tournament deleted.', 'success');
            await loadTournaments();
            populateTournamentSelects();
            renderStats();
            renderTournaments();
        } catch (error) {
            showAlert(getApiErrorMessage(error, 'Tournament could not be deleted.'), 'danger');
        }
    }

    async function deleteTeam(id) {
        if (!id || !window.confirm('Delete this team?')) return;

        try {
            await requestJson(buildUrl(TEAM_API.BASE_URL, TEAM_API.DELETE_TEAM, { id }), { method: 'DELETE' });
            showAlert('Team deleted.', 'success');
            await loadTeams();
            populateTeamSelects();
            renderStats();
            renderTeams();
        } catch (error) {
            showAlert(getApiErrorMessage(error, 'Team could not be deleted.'), 'danger');
        }
    }

    function populateTournamentSelects() {
        const options = [
            '<option value="">Select tournament</option>',
            ...state.tournaments.map((tournament) => `<option value="${escapeHtml(getEntityId(tournament))}">${escapeHtml(tournament.name || 'Untitled tournament')}</option>`)
        ].join('');

        ['standingTournamentSelect', 'matchTournament', 'teamTournament'].forEach((id) => {
            const select = document.getElementById(id);
            if (!select) return;
            const previousValue = select.value;
            select.innerHTML = options;
            if (previousValue && [...select.options].some((option) => option.value === previousValue)) {
                select.value = previousValue;
            }
        });
    }

    function populateTeamSelects() {
        const selectedTournamentId = els.matchTournament.value;
        const teams = state.teams.filter((team) => {
            const teamTournamentId = getTournamentId(team);
            return !selectedTournamentId || !teamTournamentId || teamTournamentId === selectedTournamentId;
        });

        const options = [
            '<option value="">Select team</option>',
            ...teams.map((team) => `<option value="${escapeHtml(getEntityId(team))}">${escapeHtml(getTeamName(team))}</option>`)
        ].join('');

        ['matchTeamA', 'matchTeamB'].forEach((id) => {
            const select = document.getElementById(id);
            if (!select) return;
            const previousValue = select.value;
            select.innerHTML = options;
            if (previousValue && [...select.options].some((option) => option.value === previousValue)) {
                select.value = previousValue;
            }
        });
    }

    function applyRoleRestrictions() {
        const role = getRole();

        document.querySelectorAll('[data-bs-toggle="modal"]').forEach((button) => {
            const target = button.getAttribute('data-bs-target');
            const organizerOnly = ['#tournamentModal', '#matchModal', '#announcementModal'].includes(target);
            const teamManagerOnly = target === '#teamModal';

            if (organizerOnly && role !== 'ORGANIZER') {
                button.classList.add('d-none');
            }

            if (teamManagerOnly && role !== 'ORGANIZER' && role !== 'TEAM_MANAGER') {
                button.classList.add('d-none');
            }
        });
    }

    function canManageTournaments() {
        return getRole() === 'ORGANIZER';
    }

    function canManageTeams() {
        const role = getRole();
        return role === 'ORGANIZER' || role === 'TEAM_MANAGER';
    }

    function getRole() {
        return String(state.user?.role || 'SPECTATOR').toUpperCase();
    }

    function formatRole(role) {
        return String(role || 'SPECTATOR').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    function getEntityId(entity) {
        return String(entity?._id || entity?.id || entity?.uuid || '');
    }

    function getTournamentId(team) {
        return String(team?.tournamentId || team?.tournament?._id || team?.tournament?.id || '');
    }

    function getTournamentName(id) {
        if (!id) return 'Unassigned';
        const tournament = state.tournaments.find((item) => getEntityId(item) === String(id));
        return tournament?.name || id;
    }

    function getTeamName(team) {
        if (!team || typeof team === 'string') return team || '';
        return team.teamName || team.name || team.username || getEntityId(team) || 'Unnamed team';
    }

    function getTeamNameById(id) {
        if (!id) return '';
        const team = state.teams.find((item) => getEntityId(item) === String(id));
        return team ? getTeamName(team) : '';
    }

    function formatMatchResult(match) {
        if (!match?.result) return 'Pending';
        if (typeof match.result === 'string') return match.result;

        const teamAScore = match.result.teamAScore ?? match.result.scoreA;
        const teamBScore = match.result.teamBScore ?? match.result.scoreB;
        const winner = getTeamNameById(match.result.winnerId) || match.result.winnerId;

        if (teamAScore !== undefined && teamBScore !== undefined) {
            return winner ? `${teamAScore}-${teamBScore}, winner ${winner}` : `${teamAScore}-${teamBScore}`;
        }

        return winner ? `Winner ${winner}` : 'Pending';
    }

    function formatDate(value) {
        if (!value) return 'Date TBA';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatDateTime(value) {
        if (!value) return 'Date TBA';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function toIsoDateTime(value) {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString();
    }

    function toDateTimeLocal(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16);
    }

    function emptyState(icon, title, description) {
        return `
            <div class="empty-state">
                <i class="bi ${icon}"></i>
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(description)}</span>
            </div>
        `;
    }

    function showAlert(message, type = 'info') {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <div>${escapeHtml(message)}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        els.alertPlaceholder.append(wrapper);

        window.setTimeout(() => {
            const alertElement = wrapper.querySelector('.alert');
            if (!alertElement) return;
            window.bootstrap.Alert.getOrCreateInstance(alertElement).close();
        }, 5000);
    }

    function closeModal(id) {
        const modal = window.bootstrap.Modal.getInstance(document.getElementById(id));
        if (modal) modal.hide();
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }
});
