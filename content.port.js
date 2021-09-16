let Port = function(){//wrapper
    const GET = 1;
    const POST = 0;
    let ID = 0;//unique id per message
    let queued = {};
    let ports = {};
    let listeners = {};
    let getPort = function(pname){
        if(!(pname in ports)){
            //create a new port
            let port;
            try{
                let port = chrome.runtime.connect({name:"wordgame-port"});
                port.onMessage.addListener(function(msg) {
                    let changed = false;
                    if(pname in listeners){//persistent listeners
                        listeners[pname].map(l=>l(msg.body));
                        changed = true;
                    }
                    if(msg.id in queued){
                        if(msg.err){
                            queued[msg.id][1](msg.err);
                        }else{
                            queued[msg.id][0](msg.body);
                        }
                        changed = true;
                    }
                    if(!changed){
                        //no one listens
                        console.log("Warning: no one listened to msg: ",msg);
                    }
                });
            }catch(err){
                rej(err);
                return;
            }
            ports[pname] = port;
        }
        return ports[pname];
    };
    
    this.get = function(pname,content){
        return new Promise((res,rej)=>{
            try{
                getPort(pname).postMessage({body:content, id:ID, type:GET});
            }catch(err){
                rej(err);
                return;
            }
            queued[ID] = [res,rej];//port sending successful
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
