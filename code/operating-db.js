let db=require('./db-help');
// 查询实例
// db.query('select * from url', [],function(result,fields){
//     console.log('查询结果：');
//     console.log(result);
// });


//添加实例
let  addSql = 'INSERT INTO sunglasses(desc1,name1,imgpath,price,fromname) VALUES(?,?,?,?,?)';
let  addSqlParams =['咕噜先森', '622266','22','22','2'];
db.query(addSql,addSqlParams,function(result,fields){
    console.log('添加成功')
})