const mysql = require( 'mysql' );
const {DBCONFIG} = require('./constants')
const {databaseLogger,debugLogger} = require('./logger')

let database = null;
class Database {
    constructor( config ) {
        this.connection = mysql.createConnection( config );
    }
    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            this.connection.query( sql, args, ( err, rows ) => {
                if ( err )
                    return reject( err );

                resolve( rows );
            } );
        } );
    }
    connect() {
        this.connection.connect(function(err) {
              if (err) {
                databaseLogger('error connecting: ' + err.stack);
                return;
                  }
         
                databaseLogger('connexion works , connected as id ' + this.connection.threadId);
            }.bind(this));
        }
    close() {
        return new Promise( ( resolve, reject ) => {
            this.connection.end( err => {
                if ( err )
                    return reject( err );
                resolve();
            } );
        } );
    }
}

debugLogger(DBCONFIG)
exports.getDatabase = () => {
    if(database) return database;
    database = new Database(DBCONFIG);
    database.connect();
    return database;
};