/**
 * Migration object launched by migration toolkit.
 */
const migration = {
    /**
     * This function contains codes to apply migration.
     * @param db Database connection.
     * @param log Logging function supplied by toolkit.
     * @returns {Promise}
     */
    up: (db, log) => {
      return new Promise((resolve, reject) => {
        // TODO: Write logic here
        resolve();
      });
    },
    /**
     * This function contains codes to cancel applied migration.
     * @param db Database connection.
     * @param log Logging function supplied by toolkit.
     * @returns {Promise}
     */
    down: (db, log) => {
      return new Promise((resolve, reject) => {
        // TODO: Write logic here
        resolve();
      });
    }
  };
  
  module.exports = migration;