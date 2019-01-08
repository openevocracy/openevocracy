# OpenEvocracy

Is an implementation of the Evocracy concept: http://openevocracy.org/

See a running demo instance at: http://demo.openevocracy.org/

## Project

Evocracy is a concept to organize democratic decisions using modern technology. The goal is to increase quality of decisions, create a decentralized structure and keep safety and anonymity as far as possible. Additionally there is no authority in terms of admin roles, every user has the same rights.

Discussions are outsourced in small groups, therefore every idea has a chance to be heard and the best ideas will reach higher levels, where less and less people discuss a topic. People are voted in higher levels, based on there knowledge in the topic-specific area and their ability to integrate opposite ideas. Everyone has a new chance in every topic and everyone can be part in every topic, as well as suggest new topics to discuss.

## Installation

### Requirements

You should have a server with ssh access and root permissions and you should know how to use basic shell commands in linux. Your system needs the following requirements:

  * docker: https://docs.docker.com/install/
  * docker-compose: https://docs.docker.com/compose/install/

### 1. Install OpenEvocracy

Clone the OpenEvocracy repository.

### 2. Customize the config

Inside the repository copy the file `shared/config.base.default.js` as `shared/config.base.js`.
Customize the files `shared/config.base.js` and `shared/config.env.prod.js` according to your needs.

#### Necessary changes

Change `BASE_URL` value in `shared/config.base.js` to the URL where the instance will be reachable.

## 3. Run OpenEvocracy

Change dir to project folder. Run `docker-compose up` to start OpenEvocracy in foreground mode or run `docker-compose up -d` to start OpenEvocracy in background mode.

#### Choose port

The default port is `8080`. Start OpenEvocracy e.g. with `PORT=80 docker-compose up -d` (where `80` is your port of choice).
