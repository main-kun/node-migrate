import fs, { write } from 'fs';
import { promisify } from 'util';
import moment from 'moment';
import path from 'path';

import Logger from "./LoggerInterface";
import MigrateAdapterInterface from "./MigrateAdapterInterface";

export default class MigrateManager {
  logger: Logger;
  databaseAdapter: MigrateAdapterInterface;
  db: any;

  constructor (logger: Logger , databaseAdapter: MigrateAdapterInterface) {
      this.logger = logger;
      this.databaseAdapter = databaseAdapter;
  }

  /**
   * Connects to the database
   * @returns {Promise}
   */
  async connectDb(): Promise<any> {
      const db = await this.databaseAdapter.connect();
      this.db = db;
  }

  /**
   * Reads availible migration files from the file system
   * @returns {Promise<Array<string>}
   */
  async readAvalible(): Promise<Array<string>> {
      const readDirPromise = promisify(fs.readdir);
      const files = await readDirPromise('__dirname', 'migrations');
      return files as Array<string>;
  }

  /**
   * Reads applied migrations from the database
   * @returns {Promise<Array<string>>}
   */
  async readApplied(): Promise<Array<string>> {
      const appliedMigrations = this.databaseAdapter.getApplied();
      return appliedMigrations;
  }

  /**
   * Return a list of pending migrations
   * @returns {Promise<Array<string>}
   */
  async readPending() : Promise<Array<string>> {
      const availibleMigrations: Array<string> = await this.readAvalible();
      const appliedMigrations: Array<string> = await this.readApplied();
      return availibleMigrations.filter(availible =>
          !appliedMigrations.find(applied => applied === availible));
  }
  /**
   * Creates a templates for the migration
   * @param migrationName
   * @returns {Promise<void>}
   */
  async createMigration(migrationName: string): Promise<void> {
      const name = 'm' + moment().format('YYYYMMDDHHmm') + '_' + migrationName;
      this.logger.info('Creating new migration' + name + '.');
      const readFilePromise = promisify(fs.readFile);
      const writeFilePromise = promisify(fs.writeFile);
      const template = await readFilePromise(path.resolve(__dirname, './template.js'));
      return writeFilePromise(path.resolve(__dirname, './migrations/' + name + '.js'), template)
  }
  // TODO: Separate output into it's own class
  /**
   * Display all pending migrations in console
   * 
   * @returns {Promise<void>}
   */
  async showPending(): Promise<void> {
    await this.connectDb();
    const pendingMigrations = await this.readPending();
    this.logger.info(`${pendingMigrations.length} pending migration(s) found`);
    pendingMigrations.forEach(item => { this.logger.info(item)});
    await this.databaseAdapter.closeConnection();
  }

  /**
   * Display all applied migrations in console
   * 
   * @returns {Promise<void>}
   */

  async showApplied(): Promise<void> {
    await this.connectDb();
    const appliedMigrations = await this.readApplied();
    this.logger.info(`${appliedMigrations.length} applied migration(s) found`);
    appliedMigrations.reverse().forEach(item => this.logger.info(item));
    await this.databaseAdapter.closeConnection();
  }
  /**
   * Migrates the database
   * @param n Number of migrations to apply
   * @return {Promise<void>}
   */

  async migrateUp(applyNumber?: number): Promise<void> {
    await this.connectDb();
    const pendingMigrations = await this.readPending();
    const applyCount = applyNumber ? Math.min(applyNumber, pendingMigrations.length) : pendingMigrations.length;
    const migrationsToApply = pendingMigrations.slice(0, applyCount);
    if (migrationsToApply.length > 0) {
      this.logger.info(`${migrationsToApply.length} migration(s) to apply`);
      migrationsToApply.forEach((migration) => {
        this.logger.info(migration);
      });
      for (const name of migrationsToApply) {
        this.logger.info(`Applying ${name}`);
        const migration = require(`./migrations/${name}`);
        await migration.up(this.db, this.logger);
        await this.databaseAdapter.addApplied(name);
      }
    } else {
      this.logger.info('No migrations to apply');
    }
    await this.databaseAdapter.closeConnection();
  }

  /**
   * Rollbacks the migrations
   * @param rollbackNumber number of migrations to roll back
   */

  async migrateDown(rollbackNumber: number): Promise<void> {
    await this.connectDb();
    const appliedMigrations = await this.readApplied();
    const rollbackCount = Math.min(rollbackNumber, appliedMigrations.length);
    const migrationsToRollback = appliedMigrations.slice(rollbackCount);
    if (migrationsToRollback.length > 0) {
      this.logger.info(`${migrationsToRollback.length} migration(s) to roll back`);
      for (const name of migrationsToRollback) {
        this.logger.info(`Rolling back ${name}`);
        const migration = require(`./migrations/${name}`);
        await migration.down(this.db, this.logger);
        await this.databaseAdapter.removeApplied(name);
      }
    } else {
      this.logger.info('No migrations to roll back');
    }
    await this.databaseAdapter.closeConnection();
  }
}