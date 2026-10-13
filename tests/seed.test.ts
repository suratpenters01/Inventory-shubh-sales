import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inMemoryDb } from '../backend/db/index.js';
import { LIVE_PUREIT_CATALOG, seedDatabase } from '../backend/seed.js';
import { storageService } from '../backend/services/storageService.js';

const originalEnv = {
  nodeEnv: process.env.NODE_ENV,
  adminPhone: process.env.INITIAL_ADMIN_PHONE,
  adminPassword: process.env.INITIAL_ADMIN_PASSWORD,
};

describe('production database initialization', () => {
  beforeEach(() => {
    inMemoryDb.clearAll();
    process.env.NODE_ENV = 'production';
    process.env.INITIAL_ADMIN_PHONE = '1234567890';
    process.env.INITIAL_ADMIN_PASSWORD = 'a-unique-password-123';
  });

  afterEach(() => {
    inMemoryDb.clearAll();
    if (originalEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv.nodeEnv;
    if (originalEnv.adminPhone === undefined) delete process.env.INITIAL_ADMIN_PHONE;
    else process.env.INITIAL_ADMIN_PHONE = originalEnv.adminPhone;
    if (originalEnv.adminPassword === undefined) delete process.env.INITIAL_ADMIN_PASSWORD;
    else process.env.INITIAL_ADMIN_PASSWORD = originalEnv.adminPassword;
  });

  it('syncs template item fields while preserving existing stock and users on later starts', async () => {
    await seedDatabase();

    const users = await storageService.listUsers();
    const items = await storageService.listItems();
    const templateItem = LIVE_PUREIT_CATALOG[0];
    const seededTemplateItem = items.find((item) => item.itemCode === templateItem.itemCode)!;
    expect(users).toHaveLength(1);
    expect(users[0].phone).toBe('1234567890');
    expect(users[0].role).toBe('admin');
    expect(items.length).toBeGreaterThan(0);

    await storageService.updateWarehouseBalance(seededTemplateItem._id, 42);
    await storageService.updateItem(seededTemplateItem._id, { itemName: 'Edited in inventory' });
    await seedDatabase();

    expect(await storageService.listUsers()).toHaveLength(1);
    expect((await storageService.findItemById(seededTemplateItem._id))?.itemName).toBe(templateItem.itemName);
    expect(await storageService.getWarehouseBalance(seededTemplateItem._id)).toBe(42);
  });

  it('does not clear an empty database when production administrator configuration is invalid', async () => {
    process.env.INITIAL_ADMIN_PASSWORD = 'short';

    await expect(seedDatabase()).rejects.toThrow('INITIAL_ADMIN_PASSWORD');
    expect(inMemoryDb.items.size).toBe(0);
    expect(inMemoryDb.users.size).toBe(0);
  });
});
