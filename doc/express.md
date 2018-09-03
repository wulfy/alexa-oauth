#Run configs

debug logger may log sensitive data like passwords and user emails.

## PROD
NODE_ENV=PRODUCTION DEBUG=prod,database node index.js

## DEV
remember to set 
DEBUG=* node index.js

