export const Port = function(){//wrapper
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
            //searching for the port
            let pname = port.name;
            if(!(pname in ports)){
                console.log("no matching port found",pname,ports,port);
                return false;
            }
            let portv = ports[pname];
            let idx = portv.indexOf(port);
            if(idx === -1){
                console.log("no matching port found within portv",pname,ports,port);
                return false;
            }
            //and delete it
            portv.splice(idx,1);
            if(portv.length === 0){
                delete ports[pname];
            }
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
