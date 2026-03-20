import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as scanHistoryService from '../services/scanHistory.service.js';
import { success, created, serverError, validationError } from '../utils/response.js';
import { ScanActionType } from '@prisma/client';

export async function logScan(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      validationError(res, 'User not authenticated');
      return;
    }

    const { sku, partId, actionType, success: scanSuccess, errorMsg, metadata } = req.body;

    if (!sku || !actionType) {
      validationError(res, 'SKU and actionType are required');
      return;
    }

    const scan = await scanHistoryService.logScan({
      sku,
      userId: req.user.userId,
      userName: req.user.name,
      partId,
      actionType,
      success: scanSuccess ?? true,
      errorMsg,
      metadata,
    });

    created(res, scan);
  } catch (err) {
    console.error('Log scan error:', err);
    serverError(res);
  }
}

export async function getScanHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      startDate,
      endDate,
      userId,
      actionType,
      limit = '100',
      offset = '0',
    } = req.query as any;

    const query: any = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    };

    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);
    if (userId) query.userId = parseInt(userId, 10);
    if (actionType) query.actionType = actionType as ScanActionType;

    const result = await scanHistoryService.getScanHistory(query);
    success(res, result);
  } catch (err) {
    console.error('Get scan history error:', err);
    serverError(res);
  }
}

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate, userId, actionType } = req.query as any;

    const query: any = {};
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);
    if (userId) query.userId = parseInt(userId, 10);
    if (actionType) query.actionType = actionType as ScanActionType;

    // Run all analytics queries in parallel
    const [
      mostScannedParts,
      scanFrequency,
      userActivity,
      peakHours,
      actionBreakdown,
      recentScans,
    ] = await Promise.all([
      scanHistoryService.getMostScannedParts({ ...query, limit: 10 }),
      scanHistoryService.getScanFrequencyOverTime({ ...query, interval: 'day' }),
      scanHistoryService.getUserScanActivity({ ...query, limit: 10 }),
      scanHistoryService.getPeakScanningHours(query),
      scanHistoryService.getScanActionTypeBreakdown(query),
      scanHistoryService.getRecentScans(20),
    ]);

    success(res, {
      mostScannedParts,
      scanFrequency,
      userActivity,
      peakHours,
      actionBreakdown,
      recentScans,
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    serverError(res);
  }
}

export async function getMostScannedParts(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate, userId, actionType, limit = '10' } = req.query as any;

    const query: any = { limit: parseInt(limit, 10) };
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);
    if (userId) query.userId = parseInt(userId, 10);
    if (actionType) query.actionType = actionType as ScanActionType;

    const result = await scanHistoryService.getMostScannedParts(query);
    success(res, result);
  } catch (err) {
    console.error('Get most scanned parts error:', err);
    serverError(res);
  }
}

export async function getScanFrequency(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate, userId, actionType, interval = 'day' } = req.query as any;

    const query: any = { interval };
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);
    if (userId) query.userId = parseInt(userId, 10);
    if (actionType) query.actionType = actionType as ScanActionType;

    const result = await scanHistoryService.getScanFrequencyOverTime(query);
    success(res, result);
  } catch (err) {
    console.error('Get scan frequency error:', err);
    serverError(res);
  }
}

export async function getUserActivity(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate, actionType, limit = '10' } = req.query as any;

    const query: any = { limit: parseInt(limit, 10) };
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);
    if (actionType) query.actionType = actionType as ScanActionType;

    const result = await scanHistoryService.getUserScanActivity(query);
    success(res, result);
  } catch (err) {
    console.error('Get user activity error:', err);
    serverError(res);
  }
}

export async function getPeakHours(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate, userId, actionType } = req.query as any;

    const query: any = {};
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);
    if (userId) query.userId = parseInt(userId, 10);
    if (actionType) query.actionType = actionType as ScanActionType;

    const result = await scanHistoryService.getPeakScanningHours(query);
    success(res, result);
  } catch (err) {
    console.error('Get peak hours error:', err);
    serverError(res);
  }
}
