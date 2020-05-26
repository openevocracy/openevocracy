const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoUnit = require('mongo-unit')

let app;

const expect = chai.expect;
chai.use(chaiHttp);

describe('users', () => {
	
	//beforeEach(() => mongoUnit.start());
	//afterEach(() => mongoUnit.drop());
	before(async done => {
		console.log('before');
		const testMongoUrl = await mongoUnit.start();
		process.env.TEST_DB_URL = testMongoUrl;
		console.log(process.env.TEST_DB_URL);
		
		app = require('../app');
		
		done();
	});
 
	it('should register', (done) => {
	});

});
