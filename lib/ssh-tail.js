var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    ssh2 = require('ssh2');


/**
 * SshTail object
 * 
 * @param sshOpts   See ssh2 for options
 * @constructor
 */
var SshTail = function(sshOpts) {
    
    this.connection = null;
    this.stream = null;
    this.state = 'disconnected';
    
    this.sshOpts = sshOpts || {};
};
util.inherits(SshTail, EventEmitter);


/**
 * Return the current status of the tail object or set it and emit
 * 
 * @param {String} status - Status to set, if undefined the current state will be returned
 * @param {Boolean} emit - Whether to emit the current status when being called, default = true
 * 
 * @returns {void|string} status - If called without parameters returns the current state, otherwise void
 */
SshTail.prototype.status = function(status, emit){
    
    if (status === undefined ) return this.state;    
    emit = (emit === undefined) ? true : emit;    
    this.state = status;
    if (emit) this.emit(status);
};


/**
 * Start tailing remote file(s)
 * 
 * @param {String|Array} logfiles - The logfiles that need to be tailed. Is passed straight into command, so make sure what is getting passed !
 * 
 * @returns {SshTail}
 */
SshTail.prototype.start = function(logfiles){
    
    var self = this;

    if (this.connection !== null) {
        this.emit('error', new Error('Unable to tail, already connected. Please disconnect first'));
        return this;
    }

    if (Array.isArray(logfiles)) {
        logfiles = logfiles.join(' ');
    }
        
    this.connection = new ssh2();
    
    this.connection.on('ready', function() {

        self.status('connected');

        self.connection.exec('tail -f ' + logfiles + ' & read; kill $!', function(err, stream) {
           
            if (err) return self.emit('error', err);
            
            self.status('tailing');
            
            self.stream = stream;
            
            self.stream
                
                .on('exit', function(code, signal) {                    
                    self.status('eof', false);
                    self.emit('eof', code, signal);
                })

                .on('close', function() {
                    self.status('disconnected');
                    self.connection.end();
                    self.connection = null;
                    this.stream = null;
                })

                .on('data', function(data) {
                    self.emit('stdout', data);
                })

                .stderr.on('data', function(data) {
                    self.emit('stderr', data);
                });
        });
        
    });
    
    this.connection.on('error', function(err){
        self.emit('error', err);
    });
    this.connection.connect(this.sshOpts);
    
    return this;
}


/**
 * Stop tailing the remote file
 * 
 * @returns {SshTail}
 */
SshTail.prototype.stop = function(){
    
    if (this.connection === null) {
        this.emit('error', new Error('Unable to stop, not connected.'));
        return this;
    }
    if (this.stream === null) {
        this.emit('error', new Error('Unable to stop, no stream'));
        return this;
    }
    
    this.stream.write('\n');
    return this;
}


module.exports = exports = SshTail;