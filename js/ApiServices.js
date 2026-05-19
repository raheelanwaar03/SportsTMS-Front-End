// Authentication BaseUrl API
export const AUTHENTICATION_API = {
  BASE_URL: "http://localhost:5000/api",
  LOGIN: "/users/login",
  REGISTER: "/users/register"
};

// Tournament Services BaseUrl API
export const TOURNAMENT_API = {
  BASE_URL: "http://localhost:6000/api/tournaments",
  CREATE_TOURNAMENT: "/",
  GET_ALL_TOURNAMENTS: "/",
  GET_TOURNAMENT: "/:id",
  UPDATE_TOURNAMENT: "/:id",
  DELETE_TOURNAMENT: "/:id"
};

// Team Services BaseUrl API
export const TEAM_API = {
  BASE_URL: "http://localhost:7000/api/teams",
  REGISTER_TEAM: "/",
  GET_ALL_TEAMS: "/",
  GET_TEAM: "/:id",
  UPDATE_TEAM: "/:id",
  DELETE_TEAM: "/:id",
  ADD_PLAYER: "/:id/players"
};

// Match Services BaseUrl API
export const MATCH_API = {
  BASE_URL: "http://localhost:8000/api/matches",
  SCHEDULE_MATCH: "/",
  GET_ALL_MATCHES: "/",
  GET_MATCH: "/:id",
  UPDATE_MATCH_RESULT: "/:id/result"
};

// Standings Services BaseUrl API
export const STANDINGS_API = {
  BASE_URL: "http://localhost:9000/api/standings",
  GET_TOURNAMENT_STANDINGS: "/:tournamentId"
};

// Announcements Services BaseUrl API
export const ANNOUNCEMENTS_API = {
  BASE_URL: "http://localhost:10000/api/announcements",
  CREATE_ANNOUNCEMENT: "/",
  GET_ALL_ANNOUNCEMENTS: "/",
  GET_ANNOUNCEMENT: "/:id"
};