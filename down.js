const request = require("request");
const fs  = require("fs");
const path  = require("path");
const child_process = require('child_process');
const fsextra = require('fs-extra');

module.exports = function(opt){
    opt = opt || {};
    var arr = opt.arr || []; //所有 ts的文件名或者地址
    var host = opt.host || ""; //下载 ts 的 域名，如果 arr 里面的元素已经包含，可以不传
    var outputName = opt.name ||  `output${(new Date()).getTime()}.mp4`; //导出视频的名称

    const tsFile = path.join(__dirname,`./source/${arr[0].split(".")[0]}`,);
    createDir(tsFile);//递归创建文件
    console.log("本次资源临时文件:",tsFile);

    const resultDir = path.join(__dirname,"./result");
    createDir(resultDir);//递归创建文件
    const resultFile = path.join(resultDir,outputName);

    var localPath = [] ; //下载到本地的路径
    //开始下载ts文件
    load();
    function load(){
        if(arr.length > 0){
            var u =  arr.shift();
            var url = host + u;
            console.log("progress---:",url);
            down(url);
        }else{
            //下载完成
            console.log("下载完成--开始生成配置");
            localPath.unshift("ffconcat version 1.0");
            try{
                fs.writeFileSync(path.join(tsFile,"./input.txt"), localPath.join("\n") , undefined, 'utf-8')
            }catch(e){
                console.log("写入配置出错--",e);
                return ;
            }

            //开始依赖配置合成
            console.log("开始合成-----");
            child_process.exec(`cd ${tsFile} &&  ffmpeg -i input.txt -acodec copy -vcodec copy -absf aac_adtstoasc ${resultFile}`,function(error, stdout, stderr){
                if(error){
                    console.error("合成失败---",error);
                }else{
                    console.log("合成成功--",stdout);
                    //删除临时文件
                    fsextra.remove(tsFile, err => {
                        if (err) return console.error("删除文件是失败",err)
                        console.log('删除文件成功!')
                    });
                }
            });
        }
    }

    //下载 ts 文件
    function down(url){
        var p = url.split("?")[0];
        var nm = path.parse(p);
        var nme = nm["name"] + nm["ext"];
        rpath = path.join(tsFile,nme);

        localPath.push(`file ${nme}`); //缓存本地路径，用来合成

        request({
            url:url,
            headers:{
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        },function (err, response, body) {
            if (!err && response.statusCode == 200) {
                load();
            }else{
                console.log("错误",err)
            }
        }).pipe(fs.createWriteStream(rpath));
    }



    //递归的创建文件夹
    function mkdirs(dirpath) {
        if (!fs.existsSync(path.dirname(dirpath))) {
            mkdirs(path.dirname(dirpath));
        }
        fs.mkdirSync(dirpath);
    }

    function createDir(myPath){
        fs.existsSync(myPath) == false && mkdirs(myPath);
    }
}


//ffmpeg -i "concat:1.ts|2.ts" -acodec copy out.mp3

//ffmpeg -i "concat:1.ts|2.ts" -acodec copy -vcodec copy -absf aac_adtstoasc output.mp4

// ffmpeg -i input.txt -acodec copy -vcodec copy -absf aac_adtstoasc output.mp4
/*
 ffconcat version 1.0
 file  0.ts
 file  1.ts
 */

/*

 //文件移动
 function moveFile(oldPath,newPath){
 try {
 fs.renameSync(oldPath, newPath);
 }
 catch (e) {
 console.log("报错后强制移动",e);
 fs.renameSync(oldPath, newPath);
 }
 }


 */
