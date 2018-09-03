exports.setExpireDelay = (delay) => {

      if(delay === null) return null;

     let expires = new Date();
     expires.setSeconds(expires.getSeconds() + delay);
    
    return expires;
}