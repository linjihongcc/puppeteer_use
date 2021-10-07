const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');
const useProxy = require('puppeteer-page-proxy');
const download = require("download");
const uuid_time = require('node-uuid');
let db=require('./db-help.js');

let product_obj= {};
let prefix;

    async function run (){
        const response = await axios.get(`http://localhost:9222/json/version`);

        const {webSocketDebuggerUrl} = response.data;
        console.log(webSocketDebuggerUrl);
        const browser = await puppeteer.connect({
            browserWSEndpoint: webSocketDebuggerUrl,
            defaultViewport: null,
            slowMo: 500
        });
        const details_page = await browser.newPage();

        // const page = await browser.pages();
        // const page = pages[0];
        const url2 = "https://www.lazada.com.my/shop-mens-sunglasses/?page=";
        //配置代理账号


        const details_url = 'https://www.lazada.com.my/products/curren-unisex-polarized-sunglasses-retro-uv-protection-suitable-for-beachcyclingoutdoorfishinggolf-uv400-protection-i2123553379-s8653191044.html?search=1';
        let obj = {};
        //打开产品详情
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
                    console.log('arr_images', arr_images);

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
                    // const buff = Buffer.from(desc, 'utf-8');
                    // const base64 = buff.toString('base64');
                    // console.log('desc', base64);
                });
                //是否获取描述
                if (obj['desc'] === '') flag = false;
            } catch (e) {
                console.log("错误");
                if (e) {
                    flag = false;
                }
            } finally {
                if (flag) {
                    await details_page.close();
                    break;
                }
            }
        }

        console.log(obj);


        /*    let encode_arr = [];
            encode_arr[0] = obj['title'];
            encode_arr[1] = obj['sale_price'] + ' - ' + obj['regular_price'];
            let desc = obj['desc'];
            let b = new Buffer(desc);
            encode_arr[2] = b.toString('base64');
            encode_arr[3] = 'Sunglasses';

            console.log(encode_arr);
               let data = encode_arr.join(',');
                 fs.writeFileSync("products.csv",data+"\n",{flag:"a"});

            */



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
            fs.writeFileSync(`dist/${img_name}.jpg`, await download(item));
            img_name = null;
        }
        console.log('下载完成！');
        add();
    }


    //入库






run();

    // process.exit();
    //
    // await useProxy(page, proxy).catch((e) => {
    //     console.log(e);
    // });






function add(){
    let  addSql = 'INSERT INTO sunglasses(desc1,name1,imgpath,price,fromname) VALUES(?,?,?,?,?)';
    let  addSqlParams =[product_obj.desc,product_obj.title,prefix+'.jpg',product_obj.price,product_obj.fromname];
    console.log('addSqlParams',addSqlParams);
    db.query(addSql,addSqlParams,function(result,fields){
        console.log(result,fields);
        console.log('添加成功')
    })
}

