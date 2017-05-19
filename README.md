# OpenEvocracy

Software to realize Evocracy concept: http://openevocracy.org/

Demo: http://5.230.156.126:9090/

## Project

Evocracy is a concept to organize democratic decisions using modern technology. The goal is to increase quality of decisions, create a decentralized structure and keep safety and anonymity as far as possible. Additionally there is no authority in terms of admin roles, every user has the same rights.

Discussions are outsourced in small groups, therefore every idea has a chance to be heard and the best ideas will reach higher levels, where less and less people discuss a topic. People are voted in higher levels, based on there knowledge in the topic-specific area and their ability to integrate opposite ideas. Everyone has a new chance in every topic and everyone can be part in every topic, as well as suggest new topics to discuss.

## Installation

### Requirements

You should have a server with ssh access and root permissions and you should know how to use basic shell commands in linux. Your system needs the following requirements:

  * Node.js: https://nodejs.org/en/download/package-manager/
  * MongoDB: https://docs.mongodb.com/manual/administration/install-on-linux/

### 1. Install OpenEvocracy via npm

```shell
npm install openevocracy
```

**Background**: [How to get npm?](https://docs.npmjs.com/getting-started/installing-node)

I don't want to use npm, where can I just download the code?  
Have a look at the releases page: https://github.com/openevocracy/openevocracy/releases

### 2. Database

Edit the file `install.js` to enter the mailserver configuration.

Then run

```shell
mongo evocracy install.js
mkdir data
```

### 3. Customize config.js

In `public/js/setup/config.js` you can customize the config. There are different config sets, one for productive use and one for debugging. You can choose the config set in the end of the file.

#### Necessary changes

Change `EVOCRACY_HOST` to the URL where the instance will be reachable.

## Run OpenEvocracy

```shell
mongod --dbpath=data --nojournal &
node app.js
```

## Current Roadmap

### Wostock (0.1)

  * Concept for small communities (~ up to 100 members)
  * Implementation of collaborative documents (using gulf: https://github.com/gulf/gulf)

### Gemini (0.2)

  * Concept for big communities (~ up to 1000 members)
  * Citing (to be able to argue with facts/literatur/science)
  * Basic authentication, using invitations
  * Simple reputation system
  * Basic social components (simple timeline, follower, intimates, discussion groups)
  * Add external forums for groups
  * Extend topic (gps position, urgency, etc.)

### Outlook

  * Concept for the general public
  * Decentralize user authentification
  * Forgery protection for final documents
  * Complex reputation system
  * Decentralization in technology, use Blockchain?

## License

[Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
