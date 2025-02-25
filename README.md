# SENG365 Assignment 1 API Server (Petition Site)

## Running locally

1. Use `npm install` to populate the `node_modules/` directory with up-to-date packages
2. Create a file called `.env`, following the instructions in the section below
3. Create a database with the name that you set in the `.env` file
2. Run `npm run start` or `npm run debug` to start the server
3. The server will be accessible on `localhost:4941`

### `.env` file

Create a `.env` file in the root directory of this project including the following information
```
SENG365_MYSQL_HOST={host name}
SENG365_MYSQL_USER={username}
SENG365_MYSQL_PASSWORD={password}
SENG365_MYSQL_DATABASE={database name}
```

