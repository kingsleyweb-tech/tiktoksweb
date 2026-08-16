import { Router, Request, Response } from 'express';
import { sendSms } from '../services/smsService';

const router = Router();

// POST /api/sms/send
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    const result = await sendSms(to, message);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(200).json(result);
  } catch (err: any) {
    console.error('[SmsRoute] Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error processing the SMS.' });
  }
});

export default router;
