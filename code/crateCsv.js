const fs = require('fs');
let child_process = require("child_process");
const got = require('got');
//http://192.168.50.48:56007/watermeter/../pamiai/
// let curl = 'curl http://192.168.50.48:56007/watermeter/..%2fpamiai%2f861193045667954%23I8S18R17K10_%5E7458.3.jpg/0';
// let curl = 'curl http://192.168.50.48:56007/watermeter/..%2fpamiai%2f861193045667954%23I8S18R17K10_%5E7458.3.jpg/0';

// let child = child_process.exec(curl, function (err, stdout, stderr) {
//     // console.log(stdout);
// });

//生成csv




//请求返回值
let prefix = '';
let suffix = '';
//图片值
let img_value = 0;

/*/i (忽略大小写)
/g (全文查找出现的所有匹配字符)
/m (多行查找)
/gi(全文查找、忽略大小写)
/ig(全文查找、忽略大小写)*/

/*
let decode = decodeURI('');
let s = "L0L0L0L3L2";
let num = s.replace(/[^0-9]/ig, "");
*/

/*parseInt(num)
console.log(parseInt(num));*/

async function send(img_name, item) {
    //http://192.168.50.48:56007/watermeter/../pamiai/
    let curl = `${img_name}`;
    // console.log('img_name', img_name);
    curl = encodeURIComponent(curl);
    let url2 = 'curl http://192.168.50.48:56007/watermeter/..%2fpamiai%2f' + curl + '/0'
    console.log('send:', url2);
    await child_process.exec(url2, async (err, stdout, stderr) => {
        if (err) {
            return
        }
        let digit_str = '';
        console.log(stdout);
        let obj = JSON.parse(stdout);
        digit_str = obj['digit'];
        //提取数字
        prefix = digit_str.replace(/[^0-9]/ig, "");
        prefix = parseInt(prefix);
        let rotate = 0;
        rotate = obj['rotate'];
        await sendByRotate(img_name, rotate, item);
    });
}

async function sendByRotate(img_name, rotate, img_value) {
    let curl = `${img_name}`;
    curl = encodeURIComponent(curl);
    let url2 = 'curl http://192.168.50.48:56007/watermeter/..%2fpamiai%2f' + curl + '/' + rotate;
    console.log('sendByRotate', url2);
    await child_process.exec(url2, async (err, stdout, stderr) => {
        // if(err){
        //     return
        // }
        let obj = JSON.parse(stdout);
        suffix = obj['digit'].replace(/[^0-9]/ig, "");
        suffix = parseInt(suffix);
        //提取数字
        saveData(img_value);

    });
}

function saveData(prefix, suffix, img_value, item) {
    let csvContent = `${prefix}${suffix},${img_value},${item}\n`;
    console.log('csvContent', csvContent);
    fs.writeFileSync('./data.csv', csvContent, {flag: 'a'});
}

function saveDataD(prefix, img_value, item) {
    let csvContent = `${prefix},${img_value},${item}\n`;
    console.log('csvContent', csvContent);
    fs.writeFileSync('./wattdata.csv', csvContent, {flag: 'a'});
}

async function readFileList(path) {
    //图片名数组
    let files = fs.readdirSync(path);
    // console.log(files);
    //请求返回值
    let prefix = 0;
    let suffix = 0;
    // console.log('item',files);

     for (let i = 0; i < files.length; i++) {

   // await Promise.all(files.map(async (file) => {

        let item = files[i];
         console.log('i', i);
         console.log('item', item);
        //电表
        // const url_prefix = `http://192.168.50.48:56007/watermeter/..%2fpamiai%2fwatt-hour_meter%2f`;
        //水表
        const url_prefix = `http://192.168.50.48:56007/watermeter/..%2fpamiai%2f`;


        let img_name = encodeURIComponent(item);
        //提取数字
        if (!item.split('^')[1]) {
            return
        }
        let img_value = item.split('^')[1].replace(/[^0-9]/ig, "");
        console.log('got1:', url_prefix + img_name + '/0');
        //发送请求
        await got(url_prefix + img_name + '/0', {json: true})
            .then(response => {
                if (!response.body && response.body['digit']) {
                    return
                }
                //获取数据
                prefix = response.body['digit'].replace(/[^0-9]/ig, "");
                prefix = parseInt(prefix);
                let rotate = response.body['rotate'];


                //电表
                /*     let data= fs.readFileSync(img_dir + item);
                     fs.writeFileSync(img_200+item, data, err => {
                         console.log(err);
                     });*/
                // saveDataD(prefix,img_value,item);


                //水表
                console.log('prefix,rotate', prefix, rotate);

                //第二次请求地址
                const url_prefix2 = `http://192.168.50.48:56008/watermeter/..%2fpamiai%2f`;
                console.log('got2:', url_prefix2 + img_name + '/' + rotate);
                return got(url_prefix2 + img_name + '/' + rotate, {json: true})

            })
            //电表
            /*.catch((err) => {
                //记录返回错误的图片
                let data= fs.readFileSync(img_dir + item);
                fs.writeFileSync(img_500+item, data, err => {
                    console.log(err);
                });

            });*/

            //水表
            .then(response => {
                console.log('digit', response.body['digit']);

                if (!response.body && response.body['digit']) {
                    return
                }
                suffix = response.body['digit'].replace(/[^0-9]/ig, "");
                suffix = parseInt(suffix);

                //保存到csv
                saveData(prefix, suffix, img_value, item);

                // console.log('suffix', suffix);
                let data = fs.readFileSync(img_dir + item);
                fs.writeFileSync(img_200 + item, data, err => {
                    console.log(err);
                });

            }).catch((err) => {
                console.log('err.host:', err.host);
                if (err) {
                    if (err.host.indexOf('56007') != -1) {
                        write('56007-500-l/')
                    } else if (err.host.indexOf('56008') != -1) {
                        write('56008-500-c/')
                    }
                }
                //记录返回错误的图片
                // let data = fs.readFileSync(img_dir + item);
                // fs.writeFileSync(img_500 + item, data, err => {
                //     console.log(err);
                // });
               // 16181

                function write(path_str) {
                    let data = fs.readFileSync(img_dir + item);
                    fs.writeFileSync(img_dir_pictrue2 + path_str + item, data, err => {
                        console.log(err);
                    });
                }
            });
    //}Promise
    //));map

    // console.log(i);
    // let item = files[i];

     } //for

    //顺序执行不能使用
    // files.forEach(async (item, index) => {
    //
    //
    //     // img_value = item.split('^')[1].replace(/[^0-9]/ig, "");
    //     // // console.log(img_value);
    //     // //发送请求
    //     // await send(item, img_value);
    //
    // });
}

// const img_200 = '/Users/du/test/dist/picture2/watt-hour_meter200/';
// const img_500 = '/Users/du/test/dist/picture2/watt-hour_meter500/';
// let img_dir = "/Users/du/test/dist/picture2/water/";
const img_200 = '/Users/du/test/dist/picture2/watt-hour_meter200/';
const img_500 = '/Users/du/test/dist/picture2/watt-hour_meter500/';
let img_dir = "/Users/du/test/dist/picture2/water/";
//错误目录
let img_dir_pictrue2 = "/Users/du/test/dist/picture2/";

readFileList(img_dir);