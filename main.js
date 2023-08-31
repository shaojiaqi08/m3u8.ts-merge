const fs = require("fs");
const down = require("./down");
const request = require("request");
const path = require("path");
const cheerio = require('cheerio');
// var host = 'https://cdn2.vipyz-cdn1.com/20220409/11023_d4b9e964/1000k/hls/'; //目标网站
// var outputName = "01.mp4";
const m3u8DomainUrlArr = [
    'https://cdn15.vipyz-cdn1.com/share/e3a7c7b4b90930a37e43118c0eca208b',
    'https://cdn15.vipyz-cdn1.com/share/e0ef383bd743acb4ef8081b4657d1813',
    'https://cdn16.vipyz-cdn1.com/share/b7a782741f667201b54880c925faec4b',
]
const m3u8Arr = []

deleteFile("./file")
fs.mkdirSync('./file')


// var source = fs.readFileSync("./file/index.m3u8","utf-8"); //读取 m3u8
// var arr  = source.split("\n");
// arr = arr.filter((item)=>{
//     return item.match(/\.ts$/);
// });
//
// down({
//     arr,
//     host,
//     name:outputName
// })
const m3u8Path = path.join(__dirname, `./file`,);

function downloadM3u8(url) {
    return request({
        url: url, headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest'
        }
    }, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            // load();
            console.log("成功")
        } else {
            console.log("错误", err)
        }
    })
}
// https://www.1080zyk.com/index.php?m=vod-search使用
(async function () {

    const m3u8Host = m3u8DomainUrlArr.map(item => item.split('/share')[0])

    for (let i = 0; i < m3u8DomainUrlArr.length; i++) {
        await new Promise((resolve) => {
            request({
                url: m3u8DomainUrlArr[i],
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }, function (err, response, body) {
                // let $ = cheerio.load(body)
                const realM3u8 = body.match(/var main = ("[^"]+)/)[1].replace('"', '')
                const realUrl = m3u8Host[i] + realM3u8
                console.log(realUrl)
                request({
                    url: realUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }, async function (err, response, body) {
                    const splitArr = body.split('\n')
                    const requestHost = realUrl.split('index.m3u8')[0]
                    const requestUrl = requestHost + splitArr[splitArr.length - 1]
                    m3u8Arr.push(requestUrl)
                    resolve()
                })
            })
        })
    }

    console.log(12312)

    const filesPath = path.resolve(__dirname, `./result`)
    const files = fs.readdirSync(filesPath);
    const resultNameList = files.map(item => item.replace('.mp4', ''))
    for (let i = 0; i < m3u8Arr.length; i++) {
        if (resultNameList.includes(i.toString())) {
            continue
        }
        await new Promise(async (resolve) => {
            let whiteStream = fs.createWriteStream(path.resolve(m3u8Path, `${ i }.m3u8`))
            const readStream = await downloadM3u8(m3u8Arr[i])
            readStream.pipe(whiteStream)
            readStream.on('end', function () {
                whiteStream.end()
            })
            whiteStream.on('finish', function () {
                const host = m3u8Arr[i].replace('index.m3u8', "")
                var source = fs.readFileSync(`./file/${ i }.m3u8`, "utf-8"); //读取 m3u8
                var arr = source.split("\n");
                arr = arr.filter((item) => {
                    return item.match(/\.ts$/);
                });

                down({
                    arr, host, name: `${ i }.mp4`
                })
                resolve()
            })
        })
    }
})()


// Promise.all(m3u8Arr.map((item, idx) => {
//     return downloadM3u8(item, idx).pipe(fs.createWriteStream(path.resolve(m3u8Path, `${ idx }.m3u8`)));
// })).then((arr) => {
//     console.log('已成功下载m3u8文件')
//     Promise.resolve().then(() => {
//         // var source = fs.readFileSync("./file/index.m3u8", "utf-8"); //读取 m3u8
//         // var arr = source.split("\n");
//         // arr = arr.filter((item) => {
//         //     return item.match(/\.ts$/);
//         // });
//         //
//         // down({
//         //     arr, host, name: outputName
//         // })
//     })
//
// })

// host:https://youku.com-qq.net/20190502/181_7ffa42fa/1000k/hls/
// m3u8:https://youku.com-qq.net/20190502/181_7ffa42fa/1000k/hls/index.m3u8

// request({
//     url:'https://cdn2.vipyz-cdn1.com/20220409/11023_d4b9e964/1000k/hls/index.m3u8',
//     headers:{
//         'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
//         'X-Requested-With': 'XMLHttpRequest'
//     }
// },function (err, response, body) {
//     if (!err && response.statusCode == 200) {
//         // load();
//         console.log("成功")
//     }else{
//         console.log("错误",err)
//     }
// }).pipe(fs.createWriteStream(path.join(__dirname,`./file`,'01.m3u8')))

function deleteFile(path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteall(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}
