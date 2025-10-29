import express from 'express'; import { prisma } from './db';
const router = express.Router();
router.post('/groups/create', async (req,res)=>{ const {name,description,userId}=req.body; if(!name||!userId) return res.status(400).json({error:'missing'}); const g = await prisma.group.create({data:{name,description,creatorId:userId}}); await prisma.groupMember.create({data:{groupId:g.id,userId,role:'admin'}}); return res.json({g}); });
router.get('/groups/my/:userId', async(req,res)=>{ const userId=req.params.userId; const m = await prisma.groupMember.findMany({where:{userId}, include:{group:true}}); return res.json({groups:m.map(x=>x.group)}); });
router.post('/referrals/create', async(req,res)=>{ const {userId,code}=req.body; if(!userId||!code) return res.status(400).json({error:'missing'}); const r = await prisma.referral.create({data:{userId,code}}); return res.json({r}); });
router.post('/referrals/claim', async(req,res)=>{ const {refCode,userId}=req.body; const ref = await prisma.referral.findUnique({where:{code:refCode}}); if(!ref) return res.status(404).json({error:'not found'}); const bonus = await prisma.referralBonus.create({data:{referralId:ref.id,userId,amountBigint:BigInt(1000)}}); return res.json({ok:true,bonus}); });
router.get('/market/listings', async(req,res)=>{ const listings = await prisma.listing.findMany(); return res.json({listings}); });
router.post('/market/create', async(req,res)=>{ const {title,priceCents,sellerId}=req.body; const l = await prisma.listing.create({data:{title,priceCents:BigInt(priceCents),sellerId}}); return res.json({l}); });
export default router;
