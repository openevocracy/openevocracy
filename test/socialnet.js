const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoUnit = require('mongo-unit')
const app = require('../app')

const expect = chai.expect;
chai.use(chaiHttp);

describe('socialnet', () => {
 //beforeEach(() => mongoUnit.start());
 //afterEach(() => mongoUnit.drop());

	let userId, token; 
	before(async () => {
		let res;
		
		/*res = await chai.request(app).post('/json/auth/register').send({
			email: 'test@example.com',
			password: 'password'
		});
		console.log(res.body);
		
		res = await chai.request(app).post('/json/auth/verifyEmail').send({
			email: 'test@example.com'
		});
		console.log(res.body);*/
		
		res = await chai.request(app).post('/json/auth/login').send({
			email: 'test@example.com',
			password: 'password'
		});
		console.log(res.body);
		userId = res.body.id;
		token = res.body.token;
	});
 
	it('should create follower relation', async () => {
		// TODO
	});
});
