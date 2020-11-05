// it-helper.js
const prepare = require('mocha-prepare');
//const mongoUnit = require('mongo-unit');

prepare(done => {
	//const testMongoUrl = await mongoUnit.start();
	
	//process.env.TEST_DB_URL = testMongoUrl;
	
	done();
});
