# weex-store
- weex stream 扩展封装基于 vuex api
- 所有 weex-store 版权归 ds.w@huaxianli.com 所有 请访问 huaxianli.com
- 开发完成日期 2018/03/24
- 如果遇到使用问题请联系 327759378@qq.com

## Installing

```
npm i weex-store --save
# or
yarn add weex-store
```

## Example

### /store 目录下创建 index.js
-   `name` 必须赋值，并且是为唯一字符串
-   `state` 必须赋值，是个对象也可以是个函数返回对象
-   `getters` 如果存在异步赋值，想要准确的值必须在这里定义函数返回值
-   `actions` actions 定义全局执行函数
-   `mutations` 如果想跨页面获取值必须在这里赋值到 state 中，否则只会存在内存中

weex-store 不支持 module，如果有多个 store 需要 `new Store` 多个，必须保证 Store 中 `name` 是唯一字符串

```
/store
    index.js
    /module
        carts.js
```

```js
import Store from 'weex-store'

export default new Store({
    name: 'index',
    state () {
        return {
            test: null,
            user: {
                name: 'ds.w@huaxianli.com'
            },
            info : {
                age: 22
            }
        }
    },
    getters: {
        user (state) {
            return state.user
        },
        infoAge (state) {
            return state.info.age
        }
    },
    actions: {
        async login ({commit, dispatch, mapGetters, state}, {username = 'admin', password = 'admin'}) {
            if (username === 'admin' && password === 'admin') {
                commit('SET_USER', {
                    name: 'ds.w',
                    sex: '男',
                    age: 22
                })
            }
            /// dispatch('logout', '退出登录')
        },
        logout ({ commit }, data) {
            /// console.log(data) // 退出登陆
            commit('SET_USER', null)
        }
    },
    mutations: {
        SET_USER (state, data) {
            state.user = data
        },
        SET_INFO_AGE (state, data) {
            state.info.age = data
        }
    }
})
```

### 使用例子 mapGetters

```js
import store '/store/index.js'

// 获取 store 中的 state 数据
let {user, info} = store.mapGetters(["user", "info"])

// 在 created 中获取 store 中的 state 数据

// 项目支持 await ，可以这么写
async created () {
    let {user, info} = await store.mapGetters(["user", "info"])
}

// 项目中如果不支持 await 的写法
created () {
    store.init(function (state, {commit, dispatch, states, getters, mapGetters}) {
        let {user, info} = mapGetters(['user', 'info'])
    })

    // OR

    store.mapGetters(['user', 'info'], ({user, info}) => {
        // console.log('__mapGetters', user, info)
    })

}
```
### 使用例子 getters
-   `getters()` 获取所有的 Store getters 中的方法
```js
let user = store.getters().user

// OR

let user = await store.getters().user

```

## 使用例子 states
-   `states(key?)` 获取所有的 state 状态，简单获取， key 指定后获取指定的值
```js
let { user, info } = store.states()

// OR

let { user, info } = await store.states()

// OR

let user = store.states('user')

// OR

let user = await store.states('user')

```

## 使用例子 dispatch
-   `dispatch(action)` 触发 store actions 中的方法
```js

store.dispatch('login', { username: 'admin', password: 'admin' })

// 如果想等待 store.actions 执行完再往下执行
await store.dispatch('login', { username: 'admin', password: 'admin' })

// OR

await store.dispatch('logout', () => {
    // 退出登录后...
})

```

## 使用例子 commit
-   `commit(commit)` 触发 store commit 中的方法
-   如果想跨页面取值必须在这里存储你的值，否在只会存在内存中
```js

// 可以跨页面取值
store.commit('SET_USER', {
    username: 'admin',
    password: 'admim'
})

// 不推荐这种写法，只存在内存中
store.state.user = {
    username: 'admin',
    password: 'admim'
}

```

## 使用例子 removeAll
-   `removeAll(callback?)` 删除当前 store 中的所有存储的值

```js
state.removeAll()

//OR

state.removeAll((event, key) => {
    // event 删除事件
        // event.result：表示删除是否成功，如果成功返回 "success"
        // event.data：undefined 表示删除成功
    // key 删除的 key
})

```

## 使用例子 init
-   `init()` 如果想跨页面取值必须等待 store 初始化完成， init 一般在项目不支持 await 的时候可以使用
-   `init()` 一般写在 created 中 或者 mounted 中
```js
store.init((state, {commit, dispatch, states, getters, mapGetters}) => {
    // store 初始化后
})
```