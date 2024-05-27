# doc_chat

This repo contains all of the backend code related to the document chat app.

## Getting started

- Clone this repo.
- Be sure to have `nvm` installed. Set node version eith `nvm use`.
- To install npm packages in our project, use `npm install`.
- Start your Docker daemon. Run `docker-compose up`. This runs the express server.
- The server is listening on port 4000. `http://localhost:4000/ping` should now be active.

## Development (How to contribute)

- Create a branch called `dev-<Issue Number>`
- After pushing code, create a PR with `main`
- Wait for my approval. Merge once approved

## Tools/Frameworks overview

- Code written in Node.js/Typescript.

## Repo Structure
- `./src/clients`- When interfacing with an external service or API, create a class that extends the `Client` class. The methods within the client should call the external APIs.
- `./src/services` - This is where all code that is consumed by our app is housed. Each service must be its own functional unit. For instance, the `DocAllocator` service handles all of the logic around document categorization. We will need a new service for `Agreements`.
- `./src/conf` - Contains all public configuration
- `./src/routes`- Currently not being used. If we developed our API in-house, we would use this.
- `./src/utils`- Any generic helpers live here