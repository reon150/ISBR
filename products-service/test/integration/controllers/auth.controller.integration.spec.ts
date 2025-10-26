import { INestApplication } from '@nestjs/common';
import {
  TestContext,
  setupIntegrationTest,
  tearDownIntegrationTest,
  TestUser,
} from '../integration-test-helper';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Auth Database Integration Tests', () => {
  let app: INestApplication;
  let context: TestContext;
  let dataSource: DataSource;

  beforeAll(async () => {
    context = await setupIntegrationTest();
    app = context.app;
    dataSource = context.dataSource;
  });

  afterAll(async () => {
    await tearDownIntegrationTest(context);
  });

  describe('User Database Operations', () => {
    it('should create a new user in database', async () => {
      const userRepository = dataSource.getRepository(TestUser);

      const userData = {
        email: 'newuser@example.com',
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'New',
        lastName: 'User',
        roles: 'user',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      };

      const savedUser = await userRepository.save(userData);

      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.roles).toBe(userData.roles);
      expect(savedUser.isActive).toBe(userData.isActive);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should find user by email', async () => {
      const userRepository = dataSource.getRepository(TestUser);

      // Create a test user
      const userData = {
        email: 'findme@example.com',
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'Find',
        lastName: 'Me',
        roles: 'user',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      };

      await userRepository.save(userData);

      // Find user by email
      const foundUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(userData.email);
      expect(foundUser?.firstName).toBe(userData.firstName);
      expect(foundUser?.lastName).toBe(userData.lastName);
    });

    it('should update user in database', async () => {
      const userRepository = dataSource.getRepository(TestUser);

      // Create a user
      const userData = {
        email: 'updateme@example.com',
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'Update',
        lastName: 'Me',
        roles: 'user',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      };

      const savedUser = await userRepository.save(userData);

      // Update the user
      const updatedData = {
        ...savedUser,
        firstName: 'Updated',
        lastName: 'User',
        updatedBy: 'system',
      };

      // Add a small delay to ensure updatedAt is different
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedUser = await userRepository.save(updatedData);

      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('User');
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(savedUser.updatedAt.getTime());
    });

    it('should soft delete user', async () => {
      const userRepository = dataSource.getRepository(TestUser);

      // Create a user
      const userData = {
        email: 'deleteme@example.com',
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'Delete',
        lastName: 'Me',
        roles: 'user',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      };

      const savedUser = await userRepository.save(userData);

      // Soft delete the user
      await userRepository.update(savedUser.id, {
        deletedAt: new Date(),
        deletedBy: 'system',
      });

      // Verify soft delete
      const deletedUser = await userRepository.findOne({
        where: { id: savedUser.id },
      });

      expect(deletedUser?.deletedAt).toBeDefined();
      expect(deletedUser?.deletedBy).toBe('system');
    });

    it('should verify password hash', async () => {
      const userRepository = dataSource.getRepository(TestUser);

      const plainPassword = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const userData = {
        email: 'passwordtest@example.com',
        password: hashedPassword,
        firstName: 'Password',
        lastName: 'Test',
        roles: 'user',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      };

      const savedUser = await userRepository.save(userData);

      // Verify password
      const isPasswordValid = await bcrypt.compare(plainPassword, savedUser.password);
      const isWrongPasswordValid = await bcrypt.compare('WrongPassword', savedUser.password);

      expect(isPasswordValid).toBe(true);
      expect(isWrongPasswordValid).toBe(false);
    });
  });
});
