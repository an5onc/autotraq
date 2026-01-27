import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import prisma from '../../src/repositories/prisma.js';

/**
 * INTEGRATION TEST: Full MVP Workflow
 *
 * Per CLAUDE.md Section 8, this test verifies the complete workflow:
 * 1) Register admin user
 * 2) Login, get JWT
 * 3) Create location
 * 4) Create part
 * 5) Create vehicle (year 2000)
 * 6) Attach fitment
 * 7) Create interchange group
 * 8) Add part to group
 * 9) Receive stock (qty: 10)
 * 10) Verify on-hand = 10
 * 11) Create request (qty: 3)
 * 12) Approve request
 * 13) Fulfill request
 * 14) Verify on-hand = 7
 * 15) Verify inventory events show RECEIVE and FULFILL
 */

describe('MVP Workflow Integration Test', () => {
  let token: string;
  let partId: number;
  let vehicleId: number;
  let locationId: number;
  let groupId: number;
  let requestId: number;

  beforeAll(async () => {
    // Clean up test data
    await prisma.inventoryEvent.deleteMany({});
    await prisma.requestItem.deleteMany({});
    await prisma.request.deleteMany({});
    await prisma.interchangeGroupMember.deleteMany({});
    await prisma.interchangeGroup.deleteMany({});
    await prisma.partFitment.deleteMany({});
    await prisma.part.deleteMany({});
    await prisma.vehicle.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1) Register admin user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'password123',
        name: 'Test Admin',
        role: 'admin',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('admin@test.com');
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.token).toBeDefined();
  });

  it('2) Login and get JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('3) Create location', async () => {
    const res = await request(app)
      .post('/api/inventory/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Main Warehouse' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Main Warehouse');
    locationId = res.body.data.id;
  });

  it('4) Create part', async () => {
    const res = await request(app)
      .post('/api/parts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sku: 'BRK-001',
        name: 'Brake Pad Set',
        description: 'Front brake pads',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.sku).toBe('BRK-001');
    partId = res.body.data.id;
  });

  it('5) Create vehicle (year 2000)', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        year: 2000,
        make: 'Honda',
        model: 'Civic',
        trim: 'EX',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.year).toBe(2000);
    vehicleId = res.body.data.id;
  });

  it('5b) Reject vehicle with year < 2000', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        year: 1999,
        make: 'Honda',
        model: 'Civic',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('6) Attach fitment', async () => {
    const res = await request(app)
      .post(`/api/parts/${partId}/fitments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId });

    expect(res.status).toBe(201);
    expect(res.body.data.vehicleId).toBe(vehicleId);
  });

  it('7) Create interchange group', async () => {
    const res = await request(app)
      .post('/api/interchange-groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Civic Brake Pads',
        description: 'Interchangeable brake pads for Civic',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Civic Brake Pads');
    groupId = res.body.data.id;
  });

  it('8) Add part to group', async () => {
    const res = await request(app)
      .post(`/api/interchange-groups/${groupId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ partId });

    expect(res.status).toBe(201);
    expect(res.body.data.partId).toBe(partId);
  });

  it('9) Receive stock (qty: 10)', async () => {
    const res = await request(app)
      .post('/api/inventory/receive')
      .set('Authorization', `Bearer ${token}`)
      .send({
        partId,
        locationId,
        qty: 10,
        reason: 'Initial stock',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('RECEIVE');
    expect(res.body.data.qtyDelta).toBe(10);
  });

  it('10) Verify on-hand = 10', async () => {
    const res = await request(app)
      .get(`/api/inventory/on-hand?partId=${partId}&locationId=${locationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].quantity).toBe(10);
  });

  it('11) Create request (qty: 3)', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ partId, qtyRequested: 3, locationId }],
        notes: 'Test request',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.items[0].qtyRequested).toBe(3);
    requestId = res.body.data.id;
  });

  it('12) Approve request', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('12b) Cannot approve already approved request', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Cannot approve');
  });

  it('13) Fulfill request', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/fulfill`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('FULFILLED');
  });

  it('14) Verify on-hand = 7 (10 - 3)', async () => {
    const res = await request(app)
      .get(`/api/inventory/on-hand?partId=${partId}&locationId=${locationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].quantity).toBe(7);
  });

  it('15) Verify inventory events show RECEIVE and FULFILL', async () => {
    const res = await request(app)
      .get(`/api/inventory/events?partId=${partId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const events = res.body.data.events;
    const eventTypes = events.map((e: { type: string }) => e.type);

    expect(eventTypes).toContain('RECEIVE');
    expect(eventTypes).toContain('FULFILL');

    // Verify the RECEIVE event has positive delta
    const receiveEvent = events.find((e: { type: string }) => e.type === 'RECEIVE');
    expect(receiveEvent.qtyDelta).toBe(10);

    // Verify the FULFILL event has negative delta
    const fulfillEvent = events.find((e: { type: string }) => e.type === 'FULFILL');
    expect(fulfillEvent.qtyDelta).toBe(-3);
  });
});
