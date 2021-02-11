const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoUnit = require('mongo-unit')
const app = require('../app')

const expect = chai.expect;
chai.use(chaiHttp);

describe('topics', () => {
	//beforeEach(() => mongoUnit.start());
	//afterEach(() => mongoUnit.drop());

	let uid, token, topic; 
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
		
		// login
		res = await chai.request(app).post('/json/auth/login').send({
			email: 'test@example.com',
			password: 'password'
		});
		console.log(res.body);
		uid = res.body.id;
		token = res.body.token;
		
		// create topic
		res = await chai.request(app).post('/json/topic/create').
		set('Authorization', 'JWT ' + token).send({
			name: 'test'
		});
		console.log(res.body);
		topic = res.body;
	});

	it('should create proposal for topic only in proposal stage', async () => {
		const res = await chai.request(app).post('/json/proposal/create').
			set('Authorization', 'JWT ' + token).send({
			topicId: topic._id,
			userId: uid
		});
		
		expect(res.status).to.equal(400);
		expect(res.body.alert.type).to.equal('danger');
		expect(res.body.alert.content).to.equal('TOPIC_REQUIREMENT_PROPOSAL_STAGE');
	});
 
	// TODO wait for next deadline or force it
	
	/*// @desc: Get detailed information about proposal pad
	app.get('/json/proposal/editor/:id', auth(), pads.getPadProposalDetails);
	
	// @desc: Get proposal information
	app.get('/json/proposal/view/:id', auth(), pads.getPadProposalView);*/

});
