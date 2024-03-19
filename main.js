"strict mode";

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const contentType = require("content-type");
const getRawBody = require("raw-body");
const rateLimit = require("express-rate-limit");
const { AuthURL, getFiles, getUser, revokeToken } = require("./APIs/google");
const MongoDBStore = require("connect-mongodb-session")(session);
const ejs = require("ejs");
const app = express();
const PORT = 3000;
require("dotenv").config();
const secret_key = process.env.SECRET;
const MongoURI = process.env.MONGO;
const FOLDER_ID = process.env.FOLDER_ID;
//========================================================================================================================================
var store = new MongoDBStore({
  uri: MongoURI,
  databaseName: "test",
  collection: "mySessions",
});

store.on("error", function (error) {
  console.log(error);
});

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.json(), bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    key: "sessionID",
    secret: secret_key,
    store: store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 1000, //Set to 3600 seconds because google oauth token expires in same
    },
  })
);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: "Too Many Request, try again in 1 Minute",
  })
);
app.use(
  cors({
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, content-type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "POST, GET");
    return res.status(200).json({});
  }
  if (!req.headers["content-type"]) {
    req.headers["content-type"] = "text/plain";
    req.headers["x-content-type-options"] = "nosniff";
  }
  getRawBody(
    //Limit Content Length
    req,
    {
      length: req.headers["content-length"],
      limit: "10mb",
      encoding: contentType.parse(req).parameters.charset,
    },
    function (err, string) {
      if (err) return next(err);
      req.text = string;
      next();
    }
  );
});

//========================================================================================================================================

const authCheck = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/auth/google");
  } else {
    next();
  }
};

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body>
        <div>
          <ul>
            <a href="/">home</a>
            <a href="/auth/google">Google Login</a>
            <a href="/auth/logout">Logout</a>
            <a href="/files">Files</a>
          </ul>
        </div>
        <div>
        <p>${
          req.session.user
            ? `logged in as ${req.session.user.name}`
            : "you are not logged in"
        }<p>
        </div>
      </body>
    </html>
  `);
});

app.get("/auth/google/redirect", async (req, res) => {
  const code = String(req.query.code);
  try {
    let user = await getUser(code);
    req.session.user = user;
  } catch (err) {
    console.error(err);
  }
  res.redirect("/");
});

app.get("/auth/google", async (req, res) => {
  res.redirect(await AuthURL());
});

app.get("/auth/logout", async (req, res) => {
  await revokeToken(req.session.user.access_token);
  req.session.destroy((err) => {
    if (err) {
      console.log("cant access session or destroy");
    }
  });
  res.redirect("/");
});

app.get("/files", authCheck, async (req, res) => {
  const files = await getFiles(req.session.user.access_token, FOLDER_ID);
  imageList = [];
  const generateImages = (files) => {
    files["files"].map((file) =>
      imageList.push(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`
      )
    );
  };
  generateImages(files);
  res.render("images", {
    imageList,
    accessToken: req.session.user.access_token,
  });
});
//========================================================================================================================================
app.listen(3000, () => {
  console.log("Running at PORT 3000");
});
