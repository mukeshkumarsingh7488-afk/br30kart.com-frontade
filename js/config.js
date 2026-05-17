//#region
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
window.API_BASE_URL = isLocal ? "http://localhost:5000" : "https://br30kart-api.onrender.com";
const CONFIG = {
  BASE_API_URL: window.API_BASE_URL + "/api",
};
//#endregion
