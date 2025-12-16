const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { google } = require("googleapis");
const http = require("http");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error(
    "Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables"
  );
  process.exit(1);
}

const REDIRECT_URI = "http://localhost:3000/api/auth/callback/google";

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/spreadsheets"],
  prompt: "consent",
});

console.log("Authorize this app by visiting this URL:\n");
console.log(authUrl);
console.log();

// Start a local server to receive the OAuth callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3000`);
  
  if (url.pathname === "/api/auth/callback/google") {
    const code = url.searchParams.get("code");
    
    if (code) {
      try {
        const { tokens } = await oauth2Client.getToken(code);
        
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Success!</h1><p>You can close this window and check the terminal for your refresh token.</p>");
        
        if (tokens.refresh_token) {
          console.log("\n✅ Refresh Token:");
          console.log(tokens.refresh_token);
          console.log("\nAdd this to your .env file as GOOGLE_REFRESH_TOKEN");
        } else {
          console.log("\n⚠️ No refresh token received. Tokens received:");
          console.log(JSON.stringify(tokens, null, 2));
        }
      } catch (error) {
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end("<h1>Error</h1><p>Failed to exchange code for tokens.</p>");
        console.error("Error exchanging code for tokens:", error.message);
      }
    } else {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end("<h1>Error</h1><p>No authorization code received.</p>");
    }
    
    server.close();
    process.exit(0);
  }
});

server.listen(3000, () => {
  console.log("Waiting for OAuth callback on http://localhost:3000...\n");
});
