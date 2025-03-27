const fs = require('fs')
console.log('aaaaaaaa')
fs.writeFile('C:\\Users\\DELL\\Desktop\\test.txt','abc',() => {
    console.log('文件已保存')
})