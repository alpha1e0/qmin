
# About

- vue教程：https://cn.vuejs.org/guide/scaling-up/routing
- element-plus教程：https://element-plus.org/zh-CN/
- electron教程：https://www.electronjs.org/zh/docs/latest/api/ipc-renderer

# 1 设计

## 1.1 editor后端

数据库：见wos.sql

配置

```json
{
    "token": "",
    "hkey": "",
    "en_key": "", // 对称
}
```

代码结构

**backend**

```
/
    wos.py          # 入口函数

    util/
        utils.py        # 常用工具类

    core/
        constants.py    # 常量定义
        ctx.py          # 运行时上下文：配置、数据
        bootstrap.py    # 启动工作：初始配置，初始环境

    api/                # 各个模块的api（controller）
        api_xxx.py

    service/            # 各个模块的服务类
        service_xxx.py  

    data/               # 数据目录
        wos.sql

    static/             # 静态目录
    templates/          # 模板目录
```

工作目录结构(~/.wos)：

```
/
    log/
    tmp/
    upload/
        img/
    cfg.json
    wos.db


```

**后台API**

`mdeditor`

- GET /v1/editor/category/list
- GET /v1/editor/category/get/{id}
- POST /v1/editor/category/create {"name": "", "hkey": ""}
- POST /v1/editor/category/update/{id} {"name": ""}
- DELETE /v1/editor/category/delete/{id}

- POST /v1/editor/doc/list/{cid} {"hkey": "xxx"}
- GET /v1/editor/doc/get/{id}
- POST /v1/editor/doc/create {"cid": "", "name": "", "summary":""}
- POST /v1/editor/doc/update/{id} {"title":"", "summary":""}
- DELETE /v1/editor/doc/delete/{id}

- GET /v1/editor/image/get/{id}
- POST /v1/editor/image/upload

`ivviewer`

- GET /v1/ivviewer/diretories
- POST /v1/ivviewer/images  {"path_id": "", "rate": 0}  # 返回列表
- GET /v1/ivviewer/image/{path_id} 
- GET /v1/ivviewer/raw-image/{path_id}
- POST /v1/ivviewer/index  {"path_id": ""}
- POST /v1/ivviewer/rate  {"path_id": "", "rate": 0}
- POST /v1/ivviewer/classisy


## 1.2 editor前端

### 环境搭建

```
npm install -g @vue/cli
vue create frontend_desktop
cd .\frontend_desktop
npm install electron --save-dev
vue add electron-builder
npm install vditor --save
```

vditor会到cdn(unpkg.com)加载一些js和css，为了解决这个问题需要手动编译一份，放到后台：

参考：https://ld246.com/article/1597801019644

编译vditor：

- 下载：https://github.com/Vanessa219/vditor/releases
- 解压
- pnpm install    // 注意，用npm会出错，这里用pnpm
- pnpm run build

将编译好的dist整个放到 flask后台


# 2 测试

## 2.1 调测

前台

```
npm run e-serve
```

后台

```
cd wos/backend
pytest.exe -s -v .
```

**API测试**

```
http -v post http://127.0.0.1:50000/v1/editor/category/create name="私人"
http -v get http://127.0.0.1:50000/v1/editor/category/list
http -v get http://127.0.0.1:50000/v1/editor/category/get/1
http -v delete http://127.0.0.1:50000/v1/editor/category/delete/2

http -v post http://127.0.0.1:50000/v1/editor/doc/create cid=1 title="first day of work" summary="第一天上班的经"
http -v get http://127.0.0.1:50000/v1/editor/doc/list/1  
http -v get http://127.0.0.1:50000/v1/editor/doc/get/2
http -v post http://127.0.0.1:50000/v1/editor/doc/update/1 summary="发奖金" content="##经历"

http -v post http://127.0.0.1:50000/v1/editor/verify ckey="xxx"

curl -X POST -H "Content-Type: multipart/form-data" -F "file=@D:\sources\wos\backend\test\test.jpg" http://127.0.0.1:50000/upload


http -v get http://127.0.0.1:50000/v1/ivviewer/diretories
http -v post  http://127.0.0.1:50000/v1/ivviewer/images path_id=5pGE5b2x6ZuGXOW9sembhjItLS3mmKU=
http -v get http://127.0.0.1:50000/v1/ivviewer/image/5pGE5b2x6ZuGXOW9sembhjItLS3mmKVcSU1HXzU5MTIuanBn

http -v get http://127.0.0.1:50000/v1/ivviewer/raw-image/
http -v get http://127.0.0.1:50000/v1/ivviewer/index
http -v post http://127.0.0.1:50000/v1/ivviewer/mark
http -v post http://127.0.0.1:50000/v1/ivviewer/classisy
```

## 2.2 单元测试

> cd backend
> pytest .


# 3 发布

## 3.1 前端

> npm install
> npm run e-build

后端web模式:

> npm run serve
> npm run build

## 3.2 后端

> pyinstaller wos.py --hidden-import=engineio.async_drivers.threading --add-data="data:data" --onefile --workpath pyinstaller --distpath pyinstaller

> pyinstaller wos.spec  // 第二次编译

后端web模式，将D:\sources\wos\frontend_desktop\dist copy 到 D:\sources\wos\backend\data\static 目录下(注意不要copy到static下的dist，这个dist是vditor的)



# 4 参考资料

vditor开发指南：

https://ld246.com/article/1549638745630#methods

vue使用vditor：

https://b3log.org/vditor/demo/vue.html
https://github.com/BWrong/vue-vditor
https://www.jianshu.com/p/e1ff49d110fe
https://blog.csdn.net/weixin_55697693/article/details/131618403
https://www.cnblogs.com/inkyi/p/15262850.html

vue开发Electron桌面程序：

https://juejin.cn/post/6913829610748641287



# 其他

$env:WOS_WORKSPACE="X:\hhh\.wos"
$env:WOS_WORKSPACE=""

.\venv\Scripts\activate.ps1
