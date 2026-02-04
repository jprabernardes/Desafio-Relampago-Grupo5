import { Request, Response } from 'express';
import { CheckInService } from '../services/CheckInService';

export class CheckInController {
    private checkInService: CheckInService;

    constructor() {
        this.checkInService = new CheckInService();
    }

    findMyHistory = async (req: Request, res: Response): Promise<Response> => {
        try {
            const studentId = (req as any).user.id;
            const checkins = await this.checkInService.getStudentCheckins(studentId);
            return res.status(200).json(checkins);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };

    getWeekdayStats = async (req: Request, res: Response): Promise<Response> => {
        try {
            const days = req.query.days ? Number(req.query.days) : 30;
            const data = await this.checkInService.getWeekdayStats(days);
            return res.status(200).json({ days: Math.max(1, Math.min(365, Math.floor(days || 30))), data });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };
}
