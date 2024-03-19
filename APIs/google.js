require("dotenv").config();
const querystring = require("querystring");
const axios = require("axios");
GOOGLE_CLIENT_ID = process.env.CLIENT_ID;
GOOGLE_CLIENT_SECRET = process.env.CLIENT_SECRET;

const AuthURL = () => {
  API_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: "http://localhost:3000/auth/google/redirect",
    client_id: GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope:
      "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.readonly",
  };

  return String(API_URL + "?" + querystring.stringify(options));
};

const getToken = async (access_token) => {
  /* returns this
  {
  "access_token": "String", 
  "scope": "https://www.googleapis.com/auth/userinfo.email openid", 
  "expires_in": 3599, 
  "token_type": "Bearer", 
  "id_token": "String",
  "refresh_token":String #First Time Token Request only, after, doesn't include refresh
}
  */
  const token_url = "https://oauth2.googleapis.com/token";
  const option = {
    code: access_token,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: "http://localhost:3000/auth/google/redirect",
    grant_type: "authorization_code",
  };

  return await axios
    .post(token_url, querystring.stringify(option), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

const getUser = async (code) => {
  /* returns User profile
  {
  "picture": "String", 
  "verified_email": true, 
  "id": "String", 
  "name": "", 
  "email": "String"
}
  */

  const request_uri = "https://www.googleapis.com/oauth2/v2/userinfo"; //
  //var { access_token } = await getToken(code);
  var tokens_s = await getToken(code);
  access_token = tokens_s.access_token;
  let refresh_token = null;
  if (tokens_s.refresh_token) {
    refresh_token = tokens_s.refresh_token;
  }

  const header = {
    Authorization: `Bearer ${access_token}`,
  };
  const config = {
    headers: header,
  };
  let response1 = await axios
    .get(request_uri, config) //
    .then((res) => res.data)
    .catch((err) => {
      throw err;
    });
  return { ...response1, access_token: access_token, refresh_token };
};

//Fetch Files with IDs and Folder IDs

const getFiles = async (access_token, FOLDER_ID) => {
  //Returns a JSON with key files, files is an array of json with mime type and file ID

  const request_uri = "https://www.googleapis.com/drive/v3/files";
  const header = {
    Authorization: `Bearer ${access_token}`,
  };

  const params = {
    q: `'${FOLDER_ID}' in parents`,
  };
  const config = {
    headers: header,
    params,
  };
  return await axios
    .get(request_uri, config)
    .then((res) => res.data)
    .catch();
};

//Refresh Token in case user is surfing website for more than 1 hour. Recommended to not use it.

const refreshToken = async (token) => {
  /* returns
  {
  "access_token": "String", 
  "scope": "https://www.googleapis.com/auth/drive.readonly", 
  "expires_in": 3599, 
  "token_type": "Bearer"
}
  */
  const token_url = "https://oauth2.googleapis.com/token";
  const option = {
    code: access_token,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: token,
  };

  return await axios
    .post(token_url, querystring.stringify(option), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

//Delete User Data From Session Server
const revokeToken = async (token) => {
  const revoke_url = "https://oauth2.googleapis.com/revoke?token=";
  return await axios
    .post(revoke_url + token, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((res) => res.status)
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

module.exports = {
  AuthURL,
  getUser,
  getFiles,
  refreshToken,
  revokeToken,
};
