const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoUnit = require('mongo-unit')
const app = require('../app')

const expect = chai.expect;
chai.use(chaiHttp);

describe('users', () => {
 beforeEach(() => mongoUnit.start());
 afterEach(() => mongoUnit.drop());
 
 it('should register', (done) => {
   chai.request(app).post('/json/auth/register').send({
    email: 'test@example.com',
    password: 'password'
   }).end((err, res) => {
     console.log(err, res.body);
     expect(res.body.alert.type, 'success');
     done();
   });
 })
 
})