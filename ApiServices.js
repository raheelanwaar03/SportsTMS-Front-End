// Authentication BaseUrl API
export const AUTHENTICATION_API = {
  BASE_URL: "http://localhost:5000/api",
  LOGIN: "/users/login",
  REGISTER: "/users/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  ALL_USERS: "/users"
};

// Tournament Services BaseUrl API
export const TOURNAMENT_API = {
  BASE_URL: "http://localhost:6000/api/tournaments",
  CREATE_TOURNAMENT: "/",
  GET_ALL_TOURNAMENTS: "/",
  GET_TOURNAMENT: "/:id",
  UPDATE_TOURNAMENT: "/:id",
  DELETE_TOURNAMENT: "/:id",
  GET_TOURNAMENTS_BY_ORGANIZER: "/organizer/:organizerId"
};

// Team Services BaseUrl API
export const TEAM_API = {
  BASE_URL: "http://localhost:7000/api/teams",
  REGISTER_TEAM: "/",
  GET_ALL_TEAMS: "/",
  GET_TEAM: "/:id",
  UPDATE_TEAM: "/:id",
  DELETE_TEAM: "/:id",
  ADD_PLAYER: "/:id/players",
  REMOVE_PLAYER: "/:id/players/:playerId",
  GET_TEAM_PLAYERS: "/:id/players",
  ASSIGN_TO_TOURNAMENT: "/:id/tournament/:tournamentId"
};

// Match Services BaseUrl API
export const MATCH_API = {
  BASE_URL: "http://localhost:8000/api/matches",
  SCHEDULE_MATCH: "/",
  GET_ALL_MATCHES: "/",
  GET_MATCH: "/:id",
  UPDATE_MATCH: "/:id",
  DELETE_MATCH: "/:id",
  UPDATE_RESULT: "/:id/result",
  GET_TOURNAMENT_MATCHES: "/tournament/:tournamentId",
  GET_TEAM_MATCHES: "/team/:teamId"
};

// Standings Services BaseUrl API
export const STANDINGS_API = {
  BASE_URL: "http://localhost:9000/api/standings",
  GET_TOURNAMENT_STANDINGS: "/:tournamentId",
  GET_TEAM_POSITION: "/:tournamentId/team/:teamId",
  REFRESH_STANDINGS: "/:tournamentId/refresh"
};

// Announcements BaseUrl API
export const ANNOUNCEMENTS_API = {
  BASE_URL: "http://localhost:10000/api/announcements",
  CREATE_ANNOUNCEMENT: "/",
  GET_ALL_ANNOUNCEMENTS: "/",
  GET_ANNOUNCEMENT: "/:id",
  UPDATE_ANNOUNCEMENT: "/:id",
  DELETE_ANNOUNCEMENT: "/:id",
  GET_TOURNAMENT_ANNOUNCEMENTS: "/tournament/:tournamentId"
};
