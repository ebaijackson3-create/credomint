import express from 'express';
import axios from 'axios';
import { prisma } from '../db';
const router = express.Router();

// Initiate withdrawal: create a withdrawal request and call Paystack transfer later
router.post('/initiate', async (req, res) => {
  try {
    const { userId, amountCents, beneficiaryBankCode, beneficiaryAccountNumber } = req.body;
    if (!userId || !amountCents || !beneficiaryBankCode || !beneficiaryAccountNumber) {
      return res.status(400).json({ error: 'missing params' });
    }
    // lookup user's wallet and ensure funds
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    if (!wallet) return res.status(404).json({ error: 'wallet not found' });
    if (BigInt(wallet.availableBalanceBigint) < BigInt(amountCents)) return res.status(400).json({ error: 'insufficient funds' });
    // create pending transaction of type withdrawal
    const tx = await prisma.transaction.create({
      data: { userId, walletId: wallet.id, amountBigint: BigInt(amountCents), currency: wallet.currency, status: 'pending', metadata: { flow: 'withdrawal' } }
    });
    // hold funds by decrementing availableBalance (but keep ledgerBalance for audit)
    const newAvailable = BigInt(wallet.availableBalanceBigint) - BigInt(amountCents);
    await prisma.wallet.update({ where: { id: wallet.id }, data: { availableBalanceBigint: newAvailable } });
    // In production: create transfer recipient then initiate transfer via Paystack Transfers API.
    // Here we just record the withdrawal and expect an admin/process to call transfer using Paystack keys.
    return res.json({ ok: true, txId: tx.id, message: 'Withdrawal request created. Execute Paystack transfer in backend process.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'failed to initiate withdrawal', detail: String(err) });
  }
});

export default router;
