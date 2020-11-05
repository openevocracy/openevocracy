const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoUnit = require('mongo-unit')
const app = require('../app')

const expect = chai.expect;
chai.use(chaiHttp);

describe('activities', () => {
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
 
	let activityId;
	it('should create activity', async () => {
		const res = await chai.request(app).post('/json/activity/create').
		set('Authorization', 'JWT ' + token).send({
			user: {_id: userId},
			type: 'test',
			targetId: 'test'
		});
		console.log(res.body);
		
		expect(res.status).to.equal(200);
		
		activityId = res.body.insertedIds[0];
	});
 
	it('should get user activities', async () => {
		const res = await chai.request(app).get('/json/useractivitylist/'+userId).
		set('Authorization', 'JWT ' + token).send();
		console.log(res.body);
		
		expect(res.status).to.equal(200);
		expect(res.body[0]._id).to.equal(activityId);
	});
 
	/*it('should delete user activity', async () => {
		let res;
		res = await chai.request(app).delete('/json/activity/'+activityId).
		set('Authorization', 'JWT ' + token).send({
		user: {_id: userId}
		});
		console.log(res.body);
		expect(res.status).to.equal(200);
		
		res = await chai.request(app).get('/json/useractivitylist/'+userId).
		set('Authorization', 'JWT ' + token).send();
		console.log(res.body);
		expect(res.status).to.equal(200);
		expect(res.body.length).to.equal(0);
	})*/

});
