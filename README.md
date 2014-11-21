# Remote tailing a file over ssh2

Basically this package attempts to make it a bit easier to perform tailing a remote file over SSH.

# Usage

```
tail = require('ssh2-tail');


// All options are fed 1-on-1 to ssh2, see https://github.com/mscdex/ssh2
//
var tail = new tail({
    host:       'hostnameOrIp',
    username:   'myuser',
    password:   'somepassword'
});


tail    
    .on('stderr', function(data){console.log('STDERR:' + data)})
    .on('stdout', function(data){console.log('STDOUT:' + data)})
    
    .on('disconnected', function(){console.log('disconnected')})
    .on('connected',    function(){console.log('connected')})
    .on('tailing',      function(){console.log('tailing')})
    
    .on('eof',          function(signal, code){console.log('EOF:', signal, code)})
    .on('error',        function(error){console.log('ERR:' + error)});
    
    .start([
        '/var/log/syslog', 
        '/var/log/nginx/access.log']
    )
    
    // Alternatively you can also use a string for .start(), even with multiple filenames (it is just passed on to tail -f)
    //  .start('/var/log/syslog /var/log/nginx/access.log')
    


// After 10 seconds stop the tail (and disconnect ssh)
setTimeout(function(){
    tail.stop();
}, 10*1000);
```


# Todo

- Tests
- ...
