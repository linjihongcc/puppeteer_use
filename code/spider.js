// const puppeteer = require('puppeteer-extra');
const puppeteer = require('puppeteer');
const fs = require('fs');
// const chrome = require('chrome');
const axios = require('axios');
const useProxy = require('puppeteer-page-proxy');
const download = require("download");
const {proxyRequest} = require('puppeteer-proxy');

let db=require('./db-help.js');
const uuid_time = require('node-uuid');



async function start() {

    const response = await axios.get(`http://localhost:9222/json/version`);
    const {webSocketDebuggerUrl} = response.data;
    console.log(webSocketDebuggerUrl);
    const browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl,
        defaultViewport: null,
        slowMo: 500
    });

    const page = await browser.newPage();
    const pages = await browser.pages();


    const proxy = 'https://23.95.219.197:36505';


    const url = "https://whatismyipaddress.com";
    const url2 = "https://www.lazada.com.my/shop-mens-sunglasses/?page=";

    let page_num = 5;
    //配置代理账号
    await page.authenticate({'username': 'hrkhmgxk', 'password': 'a1e5e67156'});

    let products = [];

    for (let index = 0; index <= page_num; index++) {
        //页面加载完成
        await page.goto(url2 + (index + 1), {
            timeout: 0,
            waitUntil: 'networkidle0'
        })
        console.log('网络请求全部处理');
        products = await page.evaluate(function () {
            // document.body.style.zoom = '0.3';
            //滚动到底部
            for (let y = 0; y <= 4000; y += 100) {
                window.scrollTo(0, y)
            }
            console.log('滚动');
            //获取产品
            let aLinks = document.getElementsByClassName('cRjKsc');
            let products = [];
            for (let item of aLinks) {
                // console.log(item.children[0].href);
                products.push(item.children[0].href);
            }
            console.log('产品列表已获取');
            return products;
        })
        //保存
        // for (let i of products){
        //     fs.writeFileSync("products.csv",i+"\n",{flag:"a"});
        // }
        console.log('获取产品个数：',products.length);
        console.log(`已获取第${index + 1}页产品列表`);
        //打开产品详情
        const details_page = pages[1];
        let obj = {};
        for (let details_url of products) {
            console.log(`开始下载路径为：${details_page}的产品`);
            while (true) {
                await details_page.authenticate({'username': 'hrkhmgxk', 'password': 'a1e5e67156'});

                let flag = true;
                try {
                    await details_page.goto(details_url, {timeout: 0, waitUntil: 'networkidle0'});

                    obj = await details_page.evaluate(async () => {
                        document.body.style.zoom = '0.5';
                        //图片
                        const images = document.getElementsByClassName("item-gallery__thumbnail-image");

                        let arr_images = [];

                        //提取图片链接
                        for (let i of images) {
                            let img_url = '';
                            img_url = i.src;
                            console.log('img_url', img_url);

                            img_url = img_url.split('_')[0];
                            arr_images.push(img_url);
                        }
                        // console.log('arr_images', arr_images);

                        //获取标题
                        const title = document.getElementsByClassName("pdp-mod-product-badge-title")[0].innerText;

                        //促销价
                        let sale_price = document.getElementsByClassName("pdp-price_color_orange pdp-price_size_xl")[0].innerText;

                        function convertDollars(num, decimals = 3) {
                            num = num / 6.3;
                            //转为美元
                            let numStr = num.toString();
                            let index = numStr.indexOf('.') !== -1 ? numStr.indexOf('.') : 0;
                            num = numStr.slice(0, index + decimals)
                            return '$' + num
                        }

                        //对字母进行替换
                        sale_price = sale_price.replace(/[^0-9.]/ig, "")

                        sale_price = convertDollars(sale_price);
                        console.log('sale_price', sale_price);
                        //原价
                        let regular_price = document.getElementsByClassName("pdp-price_type_deleted pdp-price_color_lightgray pdp-price_size_xs")[0].innerText;
                        regular_price = regular_price.replace(/[^0-9.]/ig, "")
                        console.log('regular_price', regular_price);

                        regular_price = convertDollars(regular_price);
                        console.log('regular_price', regular_price);
                        window.scrollTo(0, 3000);
                        // await  setTimeout(()=>{},2000);
                        console.log("滚动完成");
                        //提取描述
                        let desc = '';
                        // location.reload();

                        try {
                            desc = document.getElementsByClassName("pdp-product-detail")[0].innerHTML;
                        } catch (e) {
                            console.log('无法获取描述');
                        }


                        console.log(desc);
                        let obj = {
                            arr_images,
                            title,
                            sale_price,
                            regular_price,
                            desc
                        }
                        console.log(obj);
                        return obj;
                    });
                    //是否获取描述
                    if (obj['desc'] === ''){
                        flag = false;
                        console.log(`获取路径为：${details_page}的产品描述失败 重新获取.....`);
                    }
                } catch (e) {
                    console.log("错误",e);
                    if (e) {
                        flag = false;
                    }
                } finally {
                    if (flag) {
                        console.log(`获取完成`);
                        break;
                    }
                }
            }

            //最后一步处理
            product_obj.title = obj['title'];
            product_obj.price= obj['sale_price'] + ' - ' + obj['regular_price'];
            let b = new Buffer(obj['desc']);
            product_obj.desc = b.toString('base64');
            product_obj.fromname = 'Sunglasses';
            console.log(product_obj);


            //下载图片
            prefix = uuid_time();
            let img_name = '';
            let item = {};
            for (let i = 0; i < obj['arr_images'].length; i++) {

                //图片命名
                if (i === 0) {
                    img_name = prefix;
                } else {
                    img_name = `${prefix + '_' + i}`;
                }

                item = obj['arr_images'][i]
                console.log('下载中...', item);
               // fs.writeFileSync(`dist/${img_name}.jpg`, await download(item));
                await download(item).pipe(ws(`dist/${img_name}.jpg`));

                img_name = null;
            }
            console.log('下载产品图片完成！');
            add();
            // await details_page.close();

        }


    }
    console.log(products.length);

    const data = await useProxy.lookup(page);
    console.log(data.ip, '======');
}


start().then(r =>{
    console.log('获取完成');
} )


const ws=fs.createWriteStream;
let product_obj= {};
let prefix;

function add(){
    let  addSql = 'INSERT INTO sunglasses(desc1,name1,imgpath,price,fromname) VALUES(?,?,?,?,?)';
    let  addSqlParams =[product_obj.desc,product_obj.title,prefix+'.jpg',product_obj.price,product_obj.fromname];
    // console.log('addSqlParams',addSqlParams);
    db.query(addSql,addSqlParams,function(result,fields){
        if(result.affectedRows===1){
            console.log('入库完成');

        }
        // console.log(result,fields);
        console.log('添加成功')
    })
}

















// process.exit();

//拦截请求
// await page.setRequestInterception(true);
// const proxy = 'https://hrkhmgxk:3eed79dc1f@192.3.147.101:36505';


// const data = await useProxy.lookup(page);
// console.log(data.ip,'======');


// await Promise.all([
//    page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36'),
//    page.setViewport({ width: 1366, height: 768 }),
//
// ])


// const page = pages[0];
// const proxy = 'https://hrkhmgxk:3eed79dc1f@23.95.219.197:36505';


// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

// puppeteer.launch().then(async browser => {
//     const page = await browser.newPage();
//     await page.goto('https://bot.sannysoft.com/');
//     // await page.screenshot({path: 'screenshot.png'});
//     // await browser.close();
// });


//
// puppeteer.launch(
//     { headless: false,
//         ignoreDefaultArgs :"--enable-automation",
//         "executablePath" :"C:/Program Files/Google/Chrome/Application/chrome.exe",
//     })
//     .then(async browser => {
//     const page = await browser.newPage()
//     // await page.setViewport({ width: 800, height: 600 })
//         await page.evaluateOnNewDocument(() => {
//             Object.defineProperty(navigator, 'webdriver', {
//                 get: () => undefined,
//             });
//         });
//     console.log(`Testing adblocker plugin..`)
//     await page.goto('https://www.lazada.com.my/shop-mens-sunglasses/?page=1')
//     // await page.waitForTimeout(1000)
//     // await page.screenshot({ path: 'adblocker.png', fullPage: true })
//
//     console.log(`Testing the stealth plugin..`)
//     // await page.goto('https://bot.sannysoft.com')
//     // await page.waitForTimeout(5000)
//     // await page.screenshot({ path: 'stealth.png', fullPage: true })
//
//     console.log(`All done, check the screenshots. ✨`)
//         console.log(browser.wsEndpoint());;
//     // await browser.close()
// })