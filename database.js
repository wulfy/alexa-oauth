const mysql = require( 'mysql' );
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
                console.error('error connecting: ' + err.stack);
                return;
                  }
         
                console.log('connexion works , connected as id ' + this.connection.threadId);
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

module.exports = Database;