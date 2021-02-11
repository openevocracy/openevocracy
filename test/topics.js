const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoUnit = require('mongo-unit')
const app = require('../app')

const expect = chai.expect;
chai.use(chaiHttp);

describe('topics', () => {
	//beforeEach(() => mongoUnit.start());
	//afterEach(() => mongoUnit.drop());

	const topicName = 'testTopic';	

	let uid, token, topic; 
	before(async () => {
		let res;
		
		// login
		res = await chai.request(app).post('/json/auth/login').send({
			email: 'test@example.com',
			password: 'password'
		});
		console.log(res.body);
		uid = res.body.id;
		token = res.body.token;		
	});
	
	it('should create topic', async() => {
		let res = await chai.request(app).post('/json/topic/create').
		set('Authorization', `JWT ${token}`).send({
			name: topicName
		});

		console.log(res.body);
		topic = res.body;

		expect(topic.name).to.equal(topicName);
	});
	
	it('should list topics', async() => {
		let res = await chai.request(app).get('/json/topiclist').
		set('Authorization', `JWT ${token}`).send();
		
		console.log(res.body);
		expect(res.body).to.have.lengthOf(1);
	});
	
	it('should get basic topic data', async() => {
		let res = await chai.request(app).get(`/json/topic/basic/${topic._id}`).
		set('Authorization', `JWT ${token}`).send();
		
		console.log(res.body);
		const basicData = res.body;
		expect(basicData.topicId).to.equal(topic._id);
		expect(basicData.hasProposal).to.be.false;
		//expect(basicData.name).to.equal(topicName);
		expect(basicData.stage).to.equal(0);
	});
	
	it('should get toolbar topic data', async() => {
		let res = await chai.request(app).get(`/json/topic/toolbar/${topic._id}`).
		set('Authorization', `JWT ${token}`).send();
		
		console.log(res.body);
		const toolbarData = res.body;
		expect(toolbarData._id).to.equal(topic._id);
		expect(toolbarData.name).to.equal(topicName);
		expect(toolbarData.stage).to.equal(0);
	});
	
	it('should get overview topic data', async() => {
		let res = await chai.request(app).get(`/json/topic/overview/${topic._id}`).
		set('Authorization', `JWT ${token}`).send();
		
		console.log(res.body);
		const overviewData = res.body;
		//expect(overviewData._id).to.equal(topic._id);
		expect(overviewData.authorId).to.equal(uid);
		expect(overviewData.descDocId).not.to.be.undefined;
		expect(overviewData.descPadId).not.to.be.undefined;
		expect(overviewData.voted).to.be.false;
	});
	
	it.skip('should delete topic', async() => {
		let res = await chai.request(app).delete(`/json/topic/${topic._id}`).
		set('Authorization', `JWT ${token}`).send();
		
		console.log(res.body);
		expect(res.body).to.have.lengthOf(0);
	});
	
	it('should vote for a topic', async() => {
		let res = await chai.request(app).post('/json/topic-vote').
		set('Authorization', `JWT ${token}`).send({'topicId': topic._id, 'userId': uid});
		
		console.log(res.body.voted);
		expect(res.body.voted).to.equal(true);
	});
	
	it('should cancel vote for a topic', async() => {
		let res = await chai.request(app).post('/json/topic-unvote').
		set('Authorization', `JWT ${token}`).send({'topicId': topic._id, 'userId': uid});
		
		console.log(res.body.voted);
		expect(res.body.voted).to.equal(false);
	});

	/*
	// @desc: Download final document as pdf
	app.get('/file/topic/:id', auth(), topics.query.download);
	*/

});
