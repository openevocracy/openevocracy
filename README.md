# OpenEvocracy

Is an implementation of the Evocracy concept: https://openevocracy.org/

See a running demo instance at: https://demo.openevocracy.org/

## Project

Evocracy is a concept for organizing democratic decisions, which uses modern technology to this end. The goal is to enable high-quality decisions, decentralize decision processes and guarantee as much anonymity and safety as possible. The central aspect of the concept are *topics*. These define particular issues that shall be decided on.

Discussions are outsourced in small groups and put on record in a specific document. Due to the small group size, every idea has the chance to be considered. Based on their topic-specific knowledge and their ability to integrate ideas, members are elected as representatives of their groups for higher stages, where they once more form small groups together with other elected representatives. The number of participants and groups reduces from stage to stage until only one document is left. The process yields the selection of ideas that have proven to be reasonable and capable of consensus throughout many groups. Through this self-organizing process, good ideas are selected in an evolutionary sense.

Evocracy is expressly free of authorities; every user has the same rights. Everyone has the right to propose topics, and everyone has the possibility to participate anew in each new topic. To prevent abuse, location and authenticity of a user are verified in a decentralized manner, that is, by mutual confirmation and rating. Yet there is no possibility to identify users. Every topic is linked to one of many possible target groups, which can dynamically evolve from relations between the locations of the users and thereby can be independent of existing structures (like states, cities, etc.).

## Installation

### Requirements

You should have a server with ssh access and root permissions and you should know how to use basic shell commands in linux. Your system needs the following requirements:

  * docker: https://docs.docker.com/install/
  * docker-compose: https://docs.docker.com/compose/install/

### 1. Get Code

Get the code with *one* of the following two options:

  * Download the [latest release](https://github.com/openevocracy/openevocracy/releases/tag/v0.3.0) or
  * Clone the repository with `git clone https://github.com/openevocracy/openevocracy.git` and switch to the latest stable branch with `git checkout v0.3`

### 2. Customize the config

Inside the repository copy the file `shared/config.base.default.js` as `shared/config.base.js`.

Customize the files `shared/config.base.js` and `shared/config.env.prod.js` according to your needs.

#### Necessary changes

Change `BASE_URL` value in `shared/config.base.js` to the URL where the instance will be reachable.

### 3. Run OpenEvocracy

Change dir to project folder. Run `docker-compose up` to start OpenEvocracy in foreground mode or run `docker-compose up -d` to start OpenEvocracy in background mode.

#### Optional: Choose port

The default port is `8080`. Start OpenEvocracy e.g. with `PORT=80 docker-compose up -d` (where `80` is your port of choice).

#### Stop OpenEvocracy

If you want to stop the OpenEvocracy instance, change dir to project folder and execute `docker-compose down`.

## Update

Stop the OpenEvocracy instance, pull the updated image, start the instance again. The database will not be touched.

```
docker-compose down
docker pull openevocracy/openevocracy:v0.3
docker-compose up -d
```

When pulling the latest docker image, take great caution to specify a compatible version for the update.
