import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as vehiclesService from '../services/vehicles.service.js';
import { CreateVehicleInput, UpdateVehicleInput, VehiclesQuery } from '../schemas/vehicles.schema.js';
import { success, created, validationError, notFound, serverError } from '../utils/response.js';

export async function createVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const input: CreateVehicleInput = req.body;
    const vehicle = await vehiclesService.createVehicle(input);
    created(res, vehicle);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('year must be')) {
        validationError(res, err.message, { year: err.message });
        return;
      }
      if (err.message === 'Vehicle already exists') {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Create vehicle error:', err);
    serverError(res);
  }
}

export async function getVehicles(req: AuthenticatedRequest, res: Response) {
  try {
    const query: VehiclesQuery = req.query as unknown as VehiclesQuery;
    const result = await vehiclesService.getVehicles(query);
    success(res, result);
  } catch (err) {
    console.error('Get vehicles error:', err);
    serverError(res);
  }
}

export async function getMakes(req: AuthenticatedRequest, res: Response) {
  try {
    const year = parseInt(req.query.year as string, 10);
    if (!year || year < 2000) {
      validationError(res, 'Valid year (>= 2000) is required', { year: 'Invalid year' });
      return;
    }
    const makes = await vehiclesService.getDistinctMakes(year);
    success(res, makes);
  } catch (err) {
    console.error('Get makes error:', err);
    serverError(res);
  }
}

export async function getModels(req: AuthenticatedRequest, res: Response) {
  try {
    const year = parseInt(req.query.year as string, 10);
    const make = req.query.make as string;
    if (!year || year < 2000 || !make) {
      validationError(res, 'Valid year and make are required');
      return;
    }
    const models = await vehiclesService.getDistinctModels(year, make);
    success(res, models);
  } catch (err) {
    console.error('Get models error:', err);
    serverError(res);
  }
}

export async function getVehicleById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const vehicle = await vehiclesService.getVehicleById(id);
    success(res, vehicle);
  } catch (err) {
    if (err instanceof Error && err.message === 'Vehicle not found') {
      notFound(res, err.message);
      return;
    }
    console.error('Get vehicle error:', err);
    serverError(res);
  }
}

export async function updateVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const input: UpdateVehicleInput = req.body;
    const vehicle = await vehiclesService.updateVehicle(id, input);
    success(res, vehicle);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Vehicle not found') {
        notFound(res, err.message);
        return;
      }
      if (err.message.includes('year must be') || err.message.includes('already exists')) {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Update vehicle error:', err);
    serverError(res);
  }
}

export async function deleteVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await vehiclesService.deleteVehicle(id);
    success(res, result);
  } catch (err) {
    if (err instanceof Error && err.message === 'Vehicle not found') {
      notFound(res, err.message);
      return;
    }
    console.error('Delete vehicle error:', err);
    serverError(res);
  }
}
