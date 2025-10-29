import express from 'express'; import bodyParser from 'body-parser'; import { authRouter } from './auth'; import txRouter from './transactions'; import apiRoutes from './routes';
import depositRouter from './routes_paystack/deposit';
import withdrawRouter from './routes_paystack/withdraw';
import webhookRouter from './routes_paystack/webhook';
 
const app = express(); app.use(bodyParser.json());
app.use('/auth', authRouter); app.use('/tx', txRouter);
app.use('/api/paystack/deposit', depositRouter);
app.use('/api/paystack/withdraw', withdrawRouter);
app.use('/api/webhook', webhookRouter);
 app.use('/api', apiRoutes);
app.get('/', (req,res)=>res.json({ok:true}));
const port = process.env.PORT||4000; app.listen(port, ()=>console.log('listening',port));
