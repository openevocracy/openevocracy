# OpenEvocracy

Is an implementation of the Evocracy concept: http://openevocracy.org/

See a running demo instance at: http://demo.openevocracy.org/

## Project

Evocracy is a concept for organizing democratic decisions, which uses modern technology to this end. The goal is to enable high-quality decisions, decentralize decision processes and guarantee as much anonymity and safety as possible. The central aspect of the concept are *topics*. These define particular issues that shall be decided on.

Discussions are outsourced in small groups and put on record in a specific document. Due to the small group size, every idea has the chance to be considered. Based on their topic-specific knowledge and their ability to integrate ideas, members are elected as representatives of their groups for higher stages, where they once more form small groups together with other elected representatives. The number of participants and groups reduces from stage to stage until only one document is left. The process yields the selection of ideas that have proven to be reasonable and capable of consensus throughout many groups. Through this self-organizing process, good ideas are selected in an evolutionary sense.

Evocracy is expressly free of authorities; every user has the same rights. Everyone has the right to propose topics, and everyone has the possibility to participate anew in each new topic. To prevent abuse, location and authenticity of a user are verified in a decentralized manner, that is, by mutual confirmation and rating, and yet there is no possibility to identify users. Every topic is linked to one of many possible target groups, which can dynamically evolve from relations between the locations of the users and thereby can be independent of existing structures.


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

Change `BASE_URL` to the URL where the instance will be reachable.

## 3. Run OpenEvocracy

Run `docker-compose up` to start OpenEvocracy in foreground mode.
Run `docker-compose up -d` to start OpenEvocracy in background mode.
