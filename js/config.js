//#region MyCode
// config.js

// Check karo ki website local chal rahi hai ya live
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// ✅ Jab local chalega to localhost, jab live hoga to Render ka URL
window.API_BASE_URL = isLocal
  ? "http://localhost:5000"
  : "https://br30kart-api.onrender.com";

// Aapke purane fetch code ke liye ye constant zaroori hai
const CONFIG = {
  BASE_API_URL: window.API_BASE_URL + "/api",
};
//#endregion
