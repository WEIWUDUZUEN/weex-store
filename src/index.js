/**
 * CopyRight (C) 2018-2099 Huaxianli.
 * Created by huaxianli.com on 18/03/24
 * author ds.w 327759378@qq.com
 */
const storage = weex.requireModule('storage')
const modal = weex.requireModule('modal')

function isObject(value) {
    return Object(value) === value;
}

function isFunction(func) {
    return typeof func === 'function'
}

function isPromise(value) {
    return isObject(value) && value.constructor.name === 'Promise'
}

function isEmptyObject(e) {
    for (let t in e) return !1
    return !0
}

function clone(obj){
    if(typeof obj != 'object' || obj == null) return obj
    let newObj = new Object();
    for(var i in obj){
        newObj[i] = clone(obj[i]);
    }
    return newObj;
}

function Es5Proxy(target, handle) {
    var target2 = clone(target);
    if (typeof target2 !== 'object' || target2 === null) return target2
    Object.keys(target2).forEach(function(key){
        Object.defineProperty(target2, key, {
            get: function() {
                return handle.get && handle.get(target, key);
            },
            set: function(newVal) {
                handle.set && handle.set(target, key, newVal);
            }
        });
    })
    return target2;
}

function getters () {
    return privateData.get(this).getters;
}

function mapGetters (getters, callback, privateData) {
    let data = {}
    if (!Array.isArray(getters)) return data
    for (let key in getters) {
        if (typeof getters[key] !== 'string' ||
            !isFunction(privateData.get(this).getters[getters[key]])) return
        data[getters[key]] = privateData.get(this).getters[getters[key]](this.state)
    }
    return isFunction(callback) ? callback(data) : data
}

function dispatchRoot (dispatch, data, privateData) {
    if (typeof dispatch !== 'string' ||
        !isFunction(privateData.get(this).actions[dispatch])) return false
    return privateData.get(this).actions[dispatch]({
        commit: this.commit.bind(this),
        dispatch: this.dispatch.bind(this),
        mapGetters: this.mapGetters.bind(this),
        state: this.states(),
    }, data)
}

const Store = (function() {

    var privateData = new WeakMap();

    function Store(storeData) {

        if (typeof storeData.name !== 'string') {
            throw new Error(`Store name 命名空间不能为空且必须是一个字符串！`);
        }

        this.state = {}
        this.isRun = false

        this.mapGetters = function (getters, callback) {
            if (this.isRun && !privateData.get(this).set) {
                return mapGetters.call(this, getters, callback, privateData)
            }
            return new Promise((resolve, reject) => {
                this.init((state) => {
                    resolve(mapGetters.call(this, getters, callback, privateData))
                })
            })
        }
    
        this.dispatch = function (dispatch, data) {
            if (this.isRun && !privateData.get(this).set) {
                return dispatchRoot.call(this, dispatch, data, privateData)
            }
            return new Promise((resolve, reject) => {
                this.init((state) => {
                    resolve(dispatchRoot.call(this, dispatch, data, privateData))
                })
            })
        }
    
        this.init = function (callback) {
            //this.callback = callback
            let times = setInterval(() => {
                if (this.isRun && !privateData.get(this).set) {
                    callback.call(this, this.state, {
                        commit: this.commit.bind(this),
                        dispatch: this.dispatch.bind(this),
                        states: this.states.bind(this),
                        getters: this.getters.bind(this),
                        mapGetters: this.mapGetters.bind(this)
                    })
                    clearInterval(times)
                }
            }, 200)
        }

        this.run(storeData)
    }

    Store.prototype.states = function (key) {
        if (this.isRun && !privateData.get(this).set) {
            return key === undefined ? this.state : this.state[key]
        }
        return new Promise((resolve, reject) => {
            this.init((state) => {
                resolve(key === undefined ? state : state[key])
            })
        })
    }

    Store.prototype.getters = function () {
        if (this.isRun && !privateData.get(this).set) {
            return getters.call(this)
        }
        return new Promise((resolve, reject) => {
            this.init((state) => {
                resolve(getters.call(this))
            })
        })
    }

    Store.prototype.commit = function (mutation, data) {
        if (typeof mutation !== 'string' || !mutation in privateData.get(this).mutations) return false
        let oldPrivateData =  privateData.get(this)
        oldPrivateData.set = true
        privateData.set(this, oldPrivateData)
        privateData.get(this).mutations[mutation](this.state, data)
        return true
    }

    Store.prototype.removeAll = function (callback) {
        for (let key in privateData.get(this).stateKeys) {
            storage.removeItem(key, (event) => {
                isFunction(callback) && callback.call(this, event, key)
            })
        }
    }

    Store.prototype.run = function (storeData) {
        privateData.set(this, {
            _state: {},
            set: false,
            storeKey: '__--storeKey*' + storeData.name,
            stateKeys: {},
            actions: storeData.actions || {},
            getters: storeData.getters || {},
            mutations: storeData.mutations || {},
            getRandomKey: function () {
                return 'K-' + parseInt((Math.random() + Math.random()) * 1000000).toString()
            },
            init: async function (state, store) {
                if (isFunction(state)) {
                    state = state.call(this)
                }
                if (!isObject(state)) {
                    throw new Error(`Store.state ${state} 必须是一个 Object 或者是一个函数返回 Object`);
                }
                // state['__init'] = storeData.name
                store.state = state

                // store.state = this.storeProxy(store.state, store)
                await storage.getItem(this.storeKey, async (event) => {
                    event.data = event.result === 'success'
                        ? JSON.parse(event.data)
                        : {}
                    let stateKeys = Object.keys(state)
                    for (let key in state) {
                        this.stateKeys[key] = key in event.data
                            ? event.data[key]
                            : this.getRandomKey()
                        if (key in event.data) {
                            delete event.data[key]
                        }
                        await storage.getItem(this.stateKeys[key], async (event) => {

                            if (event.result == 'success') {
                                store.state[key] = JSON.parse(event.data)
                            }
                            //JSON.stringify(state[key])
                            storage.setItem(this.stateKeys[key], JSON.stringify(state[key]), function (setEvent) {
                                if (setEvent.result !== 'success') {
                                    throw new Error(`Store 初始化 Store state 失败！`);
                                }
                            })

                            if (key === stateKeys[stateKeys.length - 1]) {
                                store.state = await this.storeProxy(store.state, store)
                                store.isRun = true
                            }
                        })
                    }
                    if (isObject(event.data)) {
                        for (let storeKey in event.data) {
                            storage.removeItem(event.data[storeKey], (event) => {
                                if (event.result !== 'success') {
                                    console.log(`Store ${this.storeKey} 删除 ${storeKey} & ${event.data[storeKey]} 失败！`)
                                }
                            })
                        }
                    }
                    // let stateKeys = Object.keys(this.stateKeys)
                    storage.setItem(this.storeKey, JSON.stringify(this.stateKeys), function (setEvent) {
                        if (setEvent.result !== 'success') {
                            throw new Error(`Store 初始化 Store 失败！`);
                        }
                    })
                })
            },
            storeProxy: function (state, store) {
                if (!isObject(state)) return state
                var _this = this
                for (let key in state) {
                    if (isObject(state[key])) {
                        state[key] = this.storeProxy(state[key],
                            store)
                    }
                }
                return new Es5Proxy(state, {
                    get (target, key) {
                        if (store.isRun) {
                            return target[key]
                        }
                        return new Promise((resolve, reject) => {
                            store.init(() => {
                                resolve(target[key])
                            })
                        })
                    },
                    set (target, key, value) {
                        // target[key] = value
                        target[key] = _this.storeProxy(value, store)
                        if (!_this.set) return true
                        Object.keys(_this.stateKeys).forEach(async val => {
                            await storage.setItem(_this.stateKeys[val], JSON.stringify(store.state[val]), async (setEvent) => {
                                if (setEvent.result !== 'success') {
                                    throw new Error(`Store state ${val} -> ${key} 写入失败！`);
                                }
                            })
                            _this.set = false
                        })
                        return true;
                    }
                })
            }
        });

        privateData.get(this).init(storeData.state, this)
    }

    return Store;
}());

export default Store