let Port = function(){//wrapper
    const GET = 1;
    const POST = 0;
    let ID = 0;//unique id per message
    let gets = {};
    let posts = {};
    let ports = {};
    
    let Response = function(port,msg){
        this.send = function(body){
            console.log(msg);
            port.postMessage({body,id:msg.id});
        };
    };
    
    let handleGET = function(port,msg){
        let pname = port.name;
        console.log(gets,pname);
        if(pname in gets){
            gets[pname].map(cb=>{
                let response = new Response(port,msg);
                cb(msg,response);
            });
        }else{
            port.postMessage({err:"nothing is listening on the backend",id:msg.id});
        }
    };
    
    let handlePOST = function(port,msg){
        let pname = port.name;
        if(pname in posts){
            posts[pname].map(cb=>{
                cb(msg);
            });
        }else{
            console.log("nothing listened to the post message: ",msg);
        }
    };
    
    //communication
    chrome.runtime.onConnect.addListener(function(port) {
        let pname = port.name;
        if(!(pname in ports)){
            ports[pname] = [];
        }
        ports[pname].push(port);
        port.onMessage.addListener(async function(msg) {
            let type = msg.type;
            if(type === GET){
                handleGET(port,msg);
            }else if(type === POST){
                handlePOST(port,msg);
            }
        });
        port.onDisconnect.addListener(function(port){
            let ports = ports[pname];
            //searching for the port
            for(let i = 0; i < ports.length; i++){
                if(ports[i] === port){
                    ports.splice(i,1);
                    console.log("port disconnected: ",pname,port);
                    return;
                }
            }
            console.log("error, no port to be disconnected",pname,ports,port);
        });
    });
    
    this.get = function(pname,cb){
        if(!(pname in gets)){
            gets[pname] = [];
        }
        gets[pname].push(cb);
    };
    
    this.post = function(pname,cb){
        if(!(pname in posts)){
            posts[pname] = [];
        }
        posts[pname].push(cb);
    };
    
    this.broadcast = function(pname,body){
        if(pname in ports){
            ports[pname].map(p=>p.postMessage({body,id:-1}));
        }else{
            console.log("no ports are listening to the broadcast");
        }
    };
};
