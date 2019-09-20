const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoUnit = require('mongo-unit')
const app = require('../app')

const expect = chai.expect;
chai.use(chaiHttp);

describe('topics', () => {
 //beforeEach(() => mongoUnit.start());
 //afterEach(() => mongoUnit.drop());

 let token; 
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
   token = res.body.token;
 })
 
 it('should create topic', async () => {
  const res = await chai.request(app).post('/json/topic/create').
  set('Authorization', 'JWT ' + token).send({
   name: 'test'
  });
  console.log(res.body);
  
  expect(res.status).to.equal(200);
 })
 
 let list, first;
 it('should list topics', async () => {
  const res = await chai.request(app).get('/json/topiclist').
  set('Authorization', 'JWT ' + token).send();
  console.log(res.body);
  
  expect(res.status).to.equal(200);
  list = res.body;
  first = list[0];
  expect(first.name).to.equal('test');
  expect(first.stage).to.equal(0);
  expect(first.level).to.equal(0);
  expect(first.numVotes).to.equal(0);
  expect(first.numProposals).to.equal(0);
  expect(first.voted).to.equal(false);
 })

 it('should get topiclist entry', async () => {
  const res = await chai.request(app).get('/json/topiclist/'+first._id).
  set('Authorization', 'JWT ' + token).send();
  console.log(res.body);
  
  expect(res.status).to.equal(200);
  first = res.body;
  //expect(first.name).to.equal('test'); // FIXME
  expect(first.stage).to.equal(0);
  expect(first.level).to.equal(0);
  expect(first.numVotes).to.equal(0);
  expect(first.numProposals).to.equal(0);
  expect(first.voted).to.equal(false);
 })

 it('should get topic', async () => {
  const res = await chai.request(app).get('/json/topic/'+first._id).
  set('Authorization', 'JWT ' + token).send();
  console.log(res.body);
  
  expect(res.status).to.equal(200);
  first = res.body;
  expect(first.name).to.equal('test');
  expect(first.stage).to.equal(0);
  expect(first.level).to.equal(0);
  expect(first.numVotes).to.equal(0);
  expect(first.numProposals).to.equal(0);
  expect(first.voted).to.equal(false);
 })
 
 it('should update topic', async () => {
  const res = await chai.request(app).patch('/json/topic/'+first._id).
  set('Authorization', 'JWT ' + token).send();
  console.log(res.body);
  
  expect(res.status).to.equal(200);
 })
 
 it('should vote topic', async () => {
  const res = await chai.request(app).post('/json/topic-vote').
  set('Authorization', 'JWT ' + token).send();
  console.log(res.body);
  
  // TODO can vote on deleted topic?
  expect(res.status).to.equal(200);
 })
 
 it('should unvote topic', async () => {
  const res = await chai.request(app).post('/json/topic-unvote').
  set('Authorization', 'JWT ' + token).send();
  console.log(res.body);
  
  // TODO can vote on deleted topic?
  expect(res.status).to.equal(200);
 })
 
 it.skip('should get topic file', async () => {
  const res = await chai.request(app).get('/file/topic/'+first._id).
  set('Authorization', 'JWT ' + token).send();
  console.log(res.body);
  
  expect(res.status).to.equal(200);
 })
 
 /*it('should get topic editor', async () => {
  const res = await chai.request(app).get('/json/topic/editor/'+first._id).
  set('Authorization', 'JWT ' + token).send();
  console.log(res.body);
 })*/
 
 it('should delete topic', async () => {
  const res = await chai.request(app).delete('/json/topic/'+first._id).
  set('Authorization', 'JWT ' + token).send();
  console.log(res.body);
  
  expect(res.status).to.equal(200);
 })

})