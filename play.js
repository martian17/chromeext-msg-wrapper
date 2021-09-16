let aa = function(){
    return new Promise((res,rej)=>{
        throw new Error("asdfasd");
        /*try{
            throw new Error("asdfasd");
        }catch(err){
            rej(err);
        }*/
    });
};

let main = async function(){
    try{
        console.log("hahahaha");
        await aa();
        console.log("kekekek");
    }catch(err){
        let i = 1;
        console.log("what "+err);
    }
    console.log("lolololol");
};

main();