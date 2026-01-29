import { Router, Request, Response } from 'express';
import { CloudFormationService } from '../services/cloudFormationService';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();
const cfnService = new CloudFormationService();

/**
 * GET /api/stacks/status/:stackName
 * Get CloudFormation stack status
 */
router.get(
  '/status/:stackName',
  asyncHandler(async (req: Request, res: Response) => {
    const stackName = req.params.stackName as string;

    if (!stackName) {
      throw new AppError(400, 'Stack name is required');
    }

    const status = await cfnService.getStackStatus(stackName);
    res.json(status);
  })
);

export default router;
