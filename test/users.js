const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoUnit = require('mongo-unit')
const app = require('../app')

const expect = chai.expect;
chai.use(chaiHttp);

describe('users', () => {
 //beforeEach(() => mongoUnit.start());
 //afterEach(() => mongoUnit.drop());
 
 it('should register', (done) => {
   chai.request(app).post('/json/auth/register').send({
    email: 'test@example.com',
    password: 'password'
   }).end((err, res) => {
     console.log(err, res.body);
     expect(res.status).to.equal(200);
     expect(res.body.alert.type).to.equal('success');
     expect(res.body.alert.content).to.equal('USER_ACCOUNT_VERIFICATION_LINK_SENT');
     done();
   });
 })
 
 it('should not login without verification', (done) => {
   chai.request(app).post('/json/auth/login').send({
    email: 'test@example.com',
    password: 'password'
   }).end((err, res) => {
     console.log(err, res.body);
     expect(res.status).to.equal(401);
     expect(res.body.alert.type).to.equal('warning');
     expect(res.body.alert.content).to.equal('USER_ACCOUNT_NOT_VERIFIED');
     done();
   });
 })
 
 it('should verify', (done) => {
   chai.request(app).post('/json/auth/verifyEmail').send({
    email: 'test@example.com'
   }).end((err, res) => {
     console.log(err, res.body);
     expect(res.status).to.equal(200);
     expect(res.body.alert.type, 'success');
     expect(res.body.alert.content).to.equal('USER_ACCOUNT_VERIFICATION_SUCCESS');
     done();
   });
 })
 
 it('should login', (done) => {
   chai.request(app).post('/json/auth/login').send({
    email: 'test@example.com',
    password: 'password'
   }).end((err, res) => {
     console.log(err, res.body);
     expect(res.status).to.equal(200);
     expect(res.body.token).to.be.a('string');
     expect(res.body.id).to.be.a('string');
     done();
   });
 })
 
 it('should send password', (done) => {
   chai.request(app).post('/json/auth/password').send({
    email: 'test@example.com'
   }).end((err, res) => {
     console.log(err, res.body);
     expect(res.status).to.equal(200);
     expect(res.body.alert.type, 'success');
     expect(res.body.alert.content).to.equal('USER_ACCOUNT_PASSWORD_RESET');
     expect(res.body.alert.vars).to.deep.equal({email: 'test@example.com'});
     done();
   });
 })
 
})