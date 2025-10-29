import express from 'express';
import axios from 'axios';
import { prisma } from '../db';
const router = express.Router();

// Initiate a deposit: create a transaction and return Paystack authorization URL
router.post('/initiate', async (req, res) => {
  try {
    const { userId, amountCents, currency, email } = req.body;
    if (!userId || !amountCents) return res.status(400).json({ error: 'userId and amountCents required' });
    // create pending transaction
    const tx = await prisma.transaction.create({
      data: { userId, amountBigint: BigInt(amountCents), currency: currency || 'NGN', status: 'pending', metadata: { flow: 'deposit' } }
    });
    const reference = `paystack_${tx.id}`;
    // initialize with Paystack
    const resp = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: email || 'no-reply@example.com',
      amount: amountCents,
      reference
    }, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const { authorization_url } = resp.data.data;
    await prisma.transaction.update({ where: { id: tx.id }, data: { externalId: reference } });
    return res.json({ authorization_url, txId: tx.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to initiate deposit', detail: String(err) });
  }
});

export default router;
