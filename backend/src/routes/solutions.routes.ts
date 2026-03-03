import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as solutionsService from '../services/solutions.service.js';
import { success, validationError, serverError } from '../utils/response.js';

const router = Router();

router.use(authenticate);

// GET /api/solutions/search?year=2002&make=Ford&model=F150&partName=tail+light
router.get('/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year, make, model, system, component, partName } = req.query;

    if (!year || !make || !model) {
      validationError(res, 'year, make, and model are required');
      return;
    }

    const result = await solutionsService.findSolutions({
      year: parseInt(year as string, 10),
      make: make as string,
      model: model as string,
      system: system as string | undefined,
      component: component as string | undefined,
      partName: partName as string | undefined,
    });

    success(res, result);
  } catch (err) {
    console.error('Solutions search error:', err);
    serverError(res);
  }
});

// GET /api/solutions/makes — available makes (optionally filtered by year)
router.get('/makes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year } = req.query;
    const makes = await solutionsService.getAvailableMakes(year ? parseInt(year as string) : undefined);
    success(res, makes);
  } catch (err) {
    console.error('Get makes error:', err);
    serverError(res);
  }
});

// GET /api/solutions/models?make=Ford&year=2002 — models for make (optionally filtered by year)
router.get('/models', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { make, year } = req.query;
    if (!make) {
      validationError(res, 'make is required');
      return;
    }
    const models = await solutionsService.getModelsByMake(make as string, year ? parseInt(year as string) : undefined);
    success(res, models);
  } catch (err) {
    console.error('Get models error:', err);
    serverError(res);
  }
});

// GET /api/solutions/years?make=Ford&model=F150 — years for make+model
// GET /api/solutions/years — all distinct years (for year-first flow)
router.get('/years', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { make, model } = req.query;
    const years = await solutionsService.getYearsByMakeModel(
      make as string | undefined,
      model as string | undefined
    );
    success(res, years);
  } catch (err) {
    console.error('Get years error:', err);
    serverError(res);
  }
});

// GET /api/solutions/related?partIds=1,2,3 — complementary/related parts
router.get('/related', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { partIds, vehicleId } = req.query;
    if (!partIds) {
      validationError(res, 'partIds is required');
      return;
    }
    const ids = (partIds as string).split(',').map(Number).filter(Boolean);
    const related = await solutionsService.findRelatedParts(ids, vehicleId ? parseInt(vehicleId as string) : undefined);
    success(res, related);
  } catch (err) {
    console.error('Get related error:', err);
    serverError(res);
  }
});

// GET /api/solutions/by-sku?q=ABC-123 — OEM/cross-ref number lookup
router.get('/by-sku', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      validationError(res, 'q is required');
      return;
    }
    const parts = await solutionsService.findBySkuOrOem(q as string);
    success(res, parts);
  } catch (err) {
    console.error('SKU lookup error:', err);
    serverError(res);
  }
});

export default router;
