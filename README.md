## You definitely need some knowledge on how to make it work. This is just a template and an example of how you can make it work. make with Rest API, all functions in ```APIs/google.js``` to use. You can refer the below Google API docs.

``` npm install express cors body-parser cookie-parser express-session content-type raw-body express-rate-limit connect-mongodb-sesssion ejs```

```npm install dotenv ```

### Currently Displays Image fetched from folder id set in .env. /files route for accessing the page.
### Redirect uri - http://localhost:3000/auth/google/redirect
### The Following Code implements a basic safety system to protect the server, making it a bit longer.

### DOCS
```https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow```

```https://developers.google.com/drive/api/guides/about-sdk```

```https://developers.google.com/drive/api/reference/rest/v3```

you may also read a bit about express-session if you want to customize session implementation.

### MISC

```https://accounts.google.com/.well-known/openid-configuration```
