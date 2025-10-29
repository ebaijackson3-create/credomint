import express from 'express';
import { prisma } from '../db';
import crypto from 'crypto';
const router = express.Router();

// Paystack webhook handler - ensure you set PAYSTACK_SECRET_KEY and PAYSTACK_WEBHOOK_SECRET
router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string | undefined;
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
    if (!webhookSecret) {
      console.warn('No webhook secret configured.');
    } else if (signature) {
      const hash = crypto.createHmac('sha512', webhookSecret).update(req.body).digest('hex');
      if (hash !== signature) {
        console.warn('Invalid Paystack signature');
        return res.status(400).end('invalid signature');
      }
    }
    const body = JSON.parse(req.body.toString());
    const event = body.event;
    if (event === 'charge.success') {
      const data = body.data;
      const reference = data.reference;
      const amount = BigInt(data.amount);
      const tx = await prisma.transaction.findUnique({ where: { externalId: reference } });
      if (!tx) return res.status(404).end();
      if (tx.status !== 'pending') return res.status(200).end(); // idempotent
      if (tx.amountBigint !== amount) {
        console.warn('Amount mismatch for reference', reference, tx.amountBigint, amount);
        return res.status(400).end('amount mismatch');
      }
      // credit wallet: find user's wallet
      const wallet = await prisma.wallet.findFirst({ where: { userId: tx.userId } });
      if (!wallet) return res.status(404).end();
      await prisma.$transaction(async (t) => {
        // update transaction
        await t.transaction.update({ where: { id: tx.id }, data: { status: 'succeeded', completedAt: new Date() } });
        // ledger entry credit
        const newLedger = BigInt(wallet.ledgerBalanceBigint) + amount;
        await t.ledgerEntry.create({ data: { entryRef: `paystack_${tx.id}`, walletId: wallet.id, amountBigint: amount, balanceAfter: newLedger, entryType: 'credit', source: 'paystack', metadata: { txId: tx.id } } });
        await t.wallet.update({ where: { id: wallet.id }, data: { ledgerBalanceBigint: newLedger, availableBalanceBigint: newLedger } });
      });
      return res.status(200).json({ received: true });
    }
    // handle other events as needed
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).end();
  }
});

export default router;
