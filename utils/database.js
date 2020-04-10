const mysql = require( 'mysql' );
const {DBCONFIG} = require('./constants')
const {databaseLogger,debugLogger} = require('./logger')

let database = null;
class Database {
    constructor( config ) {
            this.config = config;
            this.connection = mysql.createConnection( config );
            this.connectionError = false;
    }
    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            if(this.connectionError)
            {
                this.connect();

                if(this.connectionError)
                {
                   resolve( [] ); 
                }
            }

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
                this.connectionError = true;
                return;
              }
              databaseLogger('connexion works , connected as id ' + this.connection.threadId);
              this.connectionError = false;
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
    check() {
        return !this.connectionError;
    }
}

debugLogger(DBCONFIG)
exports.getDatabase = () => {
    if(database) return database;
    database = new Database(DBCONFIG);
    database.connect();
    return database;
};