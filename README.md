## iGoalZero-OData

## Running the app

```bash
# npm install
$ npm i

$ npm run build

# watch mode
$ npm run start:dev

```

## Deploy using Docker

- initial build

```sh
$ npm run build
```

- Build the image

```sh
$ docker build --no-cache  -t igoalzero:v1.0 .
```

- Check if the image is built

```sh
$ docker images
```

- Run the container from the image

```sh
$ docker run -d  --name iGoalZero-Odata -p 5000:5000 igoalzero:v1.0
```

- To list all the containers

```sh
$ docker ps -a
```

#### pushing an image to container registry of your repository

- go to container registry in gitlab

- click on cli commands for login, build and push commands

- Log into the registry from the command line.

```sh
$ docker login registry.codecrafttech.com
```

```sh
$ docker build -t registry.codecrafttech.com/pennpetchem/igoalzero-odata-server .
```

```sh
$ docker push registry.codecrafttech.com/pennpetchem/igoalzero-odata-server
```

- Check the image ID using

```sh
$ docker images
```

## Run through docker

- to start the docker compose

```
$ docker-compose up -d
```

- to stop the Docker compose

```sh
$ docker-compose down
```
