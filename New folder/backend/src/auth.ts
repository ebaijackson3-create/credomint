import express from 'express';
import argon2 from 'argon2';
import { prisma } from './db';
import crypto from 'crypto';
const PEPPER = process.env.PASSWORD_PEPPER || 'dev-pepper';
export const authRouter = express.Router();
authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if(!email||!password) return res.status(400).json({error:'missing'});
  const hash = await argon2.hash(password + PEPPER);
  const user = await prisma.user.create({ data: { email, passwordHash: hash } });
  // create wallet for user
  await prisma.wallet.create({ data: { userId: user.id, currency: 'XAF' } });
  return res.json({ id:user.id, email:user.email });
});
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if(!email||!password) return res.status(400).json({error:'missing'});
  const user = await prisma.user.findUnique({ where: { email } });
  if(!user) return res.status(401).json({error:'invalid'});
  const ok = await argon2.verify(user.passwordHash, password + PEPPER);
  if(!ok) return res.status(401).json({error:'invalid'});
  return res.json({ ok:true, userId: user.id });
});
