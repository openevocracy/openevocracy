var assert = require('assert');
describe('Array', function() {
	before(async done => {
		console.log('before');
		/*const testMongoUrl = await mongoUnit.start();
		process.env.TEST_DB_URL = testMongoUrl;
		console.log(process.env.TEST_DB_URL);
		
		app = require('../app');*/
		
		done();
	});
	
	describe('#indexOf()', function() {		
		it('should return -1 when the value is not present', function() {
			assert.equal([1, 2, 3].indexOf(4), -1);
		});
	});
});
