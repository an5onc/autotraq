import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticate } from '../middleware/auth.middleware.js';
import * as skuService from '../services/sku.service.js';
import * as barcodeService from '../services/barcode.service.js';
import { success, validationError, notFound, serverError } from '../utils/response.js';

const router = Router();

router.use(authenticate);

// GET /api/sku/make-codes
router.get('/make-codes', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const codes = await skuService.getMakeCodes();
    success(res, codes);
  } catch (err) {
    console.error('Get make codes error:', err);
    serverError(res);
  }
});

// GET /api/sku/model-codes?make=Ford
router.get('/model-codes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const make = req.query.make as string | undefined;
    const codes = await skuService.getModelCodes(make);
    success(res, codes);
  } catch (err) {
    console.error('Get model codes error:', err);
    serverError(res);
  }
});

// GET /api/sku/system-codes
router.get('/system-codes', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const codes = await skuService.getSystemCodes();
    success(res, codes);
  } catch (err) {
    console.error('Get system codes error:', err);
    serverError(res);
  }
});

// GET /api/sku/component-codes?system=EN
router.get('/component-codes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const systemCode = req.query.system as string | undefined;
    const codes = await skuService.getComponentCodes(systemCode);
    success(res, codes);
  } catch (err) {
    console.error('Get component codes error:', err);
    serverError(res);
  }
});

// POST /api/sku/generate
router.post('/generate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { make, model, year, systemCode, componentCode, position } = req.body;
    if (!make || !model || !year || !systemCode || !componentCode) {
      validationError(res, 'make, model, year, systemCode, and componentCode are required');
      return;
    }
    const result = await skuService.generateSku({ make, model, year, systemCode, componentCode, position });
    const barcodePng = await barcodeService.generateBarcode(result.sku);
    success(res, { ...result, barcode_png_base64: barcodePng });
  } catch (err) {
    if (err instanceof Error) {
      validationError(res, err.message);
      return;
    }
    console.error('Generate SKU error:', err);
    serverError(res);
  }
});

// GET /api/sku/lookup/:sku
router.get('/lookup/:sku', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const decoded = await skuService.lookupSku(req.params.sku);
    if (!decoded) {
      notFound(res, 'Could not decode SKU');
      return;
    }
    const barcodePng = await barcodeService.generateBarcode(req.params.sku);
    success(res, { sku: req.params.sku, decoded, barcode_png_base64: barcodePng });
  } catch (err) {
    console.error('Lookup SKU error:', err);
    serverError(res);
  }
});

export default router;
