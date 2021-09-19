let Port = function(){//wrapper
    const GET = 1;
    const POST = 0;
    let ID = 0;//unique id per message
    let that = this;
    let queued = {};
    let ports = {};
    let listeners = {};
    let getPort = function(pname){
        if(!(pname in ports)){
            //create a new port
            let port;
            try{
                port = chrome.runtime.connect({name:pname});
                console.log(port);
                port.onMessage.addListener(function(msg) {
                    let changed = false;
                    if(pname in listeners){//persistent listeners
                        listeners[pname].map(l=>l(msg.body));
                        changed = true;
                    }
                    let queued_p = queued[pname];//queued port
                    if(msg.id in queued_p){
                        if(msg.err){
                            queued_p[msg.id][1](msg.err);
                        }else{
                            queued_p[msg.id][0](msg.body);
                        }
                        delete queued_p[msg.id];
                        changed = true;
                    }
                    if(!changed){
                        //no one listens
                        console.log("Warning: no one listened to msg: ",msg);
                    }
                });
                port.onDisconnect.addListener("close",function(){
                    console.log("disconnected: "+port.name);
                    delete ports[pname];
                    let queued_p = queued[pname];
                    delete queued[panme];
                    for(let id in queued_p){
                        [res,rej,msg] = queued_p[id];
                        if(msg.type === GET){
                            try{
                                let result = that.get(pname,msg.body);
                                res(result);
                            }catch(err){
                                rej(err);
                            }
                        }else if(msg.type === POST){//never happens in theory, but can't hurt to future proof
                            console.log("post in queue",msg);
                            that.post(pname,msg.body);
                        }
                    }
                });
                queued[pname] = {};
            }catch(err){
                console.log(err);
                return;
            }
            ports[pname] = port;
        }
        return ports[pname];
    };
    
    this.get = function(pname,content){
        return new Promise((res,rej)=>{
            try{
                let msg = {body:content, id:ID, type:GET};
                getPort(pname).postMessage(msg);
            }catch(err){
                rej(err);
                return;
            }
            queued[pname][id] = [res,rej,msg];//adding it to the queue
        });
    };
    this.post = function(pname,content){
        //one directional message
        getPort(pname).postMessage({body:content, id:ID++, type:POST});
    };
    this.listen = function(pname,cb){
        getPort(pname);//creates a port if DNE
        if(!(pname in listeners)){
            listeners[pname] = [];
        }
        listeners[pname].push(cb);
    };
};
