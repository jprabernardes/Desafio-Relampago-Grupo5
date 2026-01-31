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
}
