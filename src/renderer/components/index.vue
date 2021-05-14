<template>
    <div class="cover" v-loading="searchLoading">
        <div v-if="showPro" style="position:fixed;width:100%;z-index:1000">
            <el-progress :stroke-width="10" :percentage="percentage"></el-progress>
        </div>
        <!-- <button type="button" aria-label="Close" class="el-message-box__headerbtn close_btn" @click="closeApp()"><i
                class="el-message-box__close el-icon-close"></i></button> -->
        <div class="md-layout md-gutter">
            <div class="md-layout-item" style="margin-top: 10px;">
                <md-button @click="index">首页</md-button>
                <md-button>设置</md-button>
                <md-button>关于</md-button>
            </div>
        </div>
        <div class="md-layout md-gutter">
            <div class="md-layout-item" style="margin: 7px 0px">
                <el-input placeholder="请输入内容" v-model="searchVal" class="input-with-select" style="width:40%">
                    <el-button slot="append" icon="el-icon-search" @click="search"></el-button>
                </el-input>
            </div>
        </div>
        <div v-if="loading">数据加载中,请稍后...</div>
        <div class="md-layout md-gutter md-alignment-center ">
            <div class="md-layout-item md-size-30 layout" v-for="(img,index) in listImg" :key="index"
                @click="showDetail(img)">
                <img :src="img.urls.thumb" style="height:100%" width="284" />
                {{img.width}}x{{img.height}}
            </div>
        </div>
        <md-button @click="laodingMore()">加载更多</md-button>
        <md-button @click="toTop()">回到顶部</md-button>
        <md-dialog :md-active.sync="showDialog" :md-close-on-esc="false" :md-click-outside-to-close="false">
            <md-dialog-title>详细</md-dialog-title>
            <img :src="currImg.urls.small" />
            <md-dialog-actions>
                <md-button @click="settingWallpaper()" v-loading="detailLoading"
                    element-loading-background="rgba(0, 0, 0, 0.8)">设为壁纸</md-button>
                <md-button @click="closeDialog()">关闭</md-button>
            </md-dialog-actions>
        </md-dialog>
    </div>
</template>

<script>
    const app = require('electron').remote.app
    const {
        ipcRenderer
    } = require('electron')
    import req from "../unsplashReq"
    import {
        Loading
    } from 'element-ui';

    // 只在windows平台下加载
    var edge = require('electron-edge-js');
    const request = require("request");
    const fs = require("fs");
    const https = require("https");
    var UUID = require('uuid');
    var setWallPaper = edge.func(`
    using System.Threading.Tasks;
    using System.Runtime.InteropServices;

    public class Startup
    {
        public async Task<object> Invoke(object input)
        {
            string v = (string)input;
            return SystemParametersInfo(20, 1, v, 1);
        }
        [DllImport("user32.dll", EntryPoint = "SystemParametersInfo")]
	    public static extern int SystemParametersInfo(
            int uAction,
            int uParam,
            string lpvParam,
            int fuWinIni
        );
    }

`)

    export default {
        name: '',
        components: {},
        data() {
            return {
                isSearch: false,
                percentage: 0,
                searchLoading: false,
                searchVal: "",
                collctionId: "16122867",
                showPro: false,
                detailLoading: false,
                currPage: 1,
                searchCurrPage: 1,
                listImg: [],
                showDialog: false,
                quitDialog: false,
                loading: true,
                currImg: {
                    urls: {
                        small: "", //以jpg格式返回宽度为400像素的照片
                        regular: "", //以jpg格式返回宽度为1080像素的照片。
                        thumb: "", //以200像素的宽度返回jpg格式的照片
                        full: "", //以最大尺寸的jpg格式返回照片
                        raw: "" //返回基本图片网址
                    }
                }
            }
        },
        mounted() {
            req.getCollection(this.collctionId, this.currPage, 21).then(resp => {
                this.listImg = resp;
                this.loading = false;
            })

        },
        methods: {
            getResPath() {
                if (process.env.NODE_ENV == 'development') {
                    return "../../../extraResources"
                } else {
                    return process.resourcesPath + "/extraResources"
                }
            },
            showDetail(img) {
                this.currImg = img;
                this.showDialog = true;

            },
            settingWallpaper() {
                if (process.platform === 'win32') {
                    this.showPro = true;
                    this.detailLoading = true;
                    //渲染器进程代码
                    var rootPath = require('path').resolve(__dirname, this.getResPath())
                    try {
                        fs.statSync(rootPath);
                    } catch (err) {
                        fs.mkdirSync(rootPath)
                    }
                    ipcRenderer.send("download", this.currImg.urls.full + "+" + rootPath + "/" + UUID
                        .v1() +
                        ".jpg")
                    ipcRenderer.on("sendPro", (event, data) => {
                        this.percentage = parseInt(data);
                    });
                    ipcRenderer.on("sendMain", (event, data) => {
                        var ret = setWallPaper(data, true, function (err, val) {
                            if (err) {
                                throw err
                            } else {
                                return val;
                            }

                        })
                        if (ret == 1) {
                            this.detailLoading = false;
                            this.showPro = false;
                            this.percentage = 0;
                            this.$message({
                                message: '壁纸设置成功!',
                                type: 'success'
                            });
                            Message.closeAll()
                        }
                    })

                } else {
                    this.$message({
                        message: '目前仅支持Windows使用!',
                        type: 'error'
                    });
                }
            },
            closeDialog() {
                this.showDialog = false;
            },
            closeApp() {
                this.$confirm('确定退出应用吗?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    app.quit();
                }).catch(() => {

                });
            },
            laodingMore() {
                if (this.isSearch) {
                    this.searchLoading = true;
                    this.searchCurrPage = this.searchCurrPage + 1;
                    req.searchPhoto(this.searchVal, this.searchCurrPage, 21).then(resp => {
                        let list = this.listImg;
                        list = list.concat(resp.results)
                        this.listImg = list;
                        this.searchLoading = false;
                    }).catch(err => {
                        this.searchLoading = false;
                    });
                } else {
                    this.currPage = this.currPage + 1;
                    let list = this.listImg;
                    req.getCollection(this.collctionId, this.currPage, 21).then(resp => {
                        this.loading = false;
                        if (resp.length == 0) {
                            this.$message({
                                showClose: true,
                                center: true,
                                message: '已经没有更多的壁纸了!'
                            });
                        } else {
                            list = list.concat(resp)
                            this.listImg = list;
                        }

                    })
                }

            },
            downloadFileAsync(uri, dest) {
                return new Promise((resolve, reject) => {
                    // 确保dest路径存在
                    const file = fs.createWriteStream(dest);

                    http.get(uri, (res) => {
                        if (res.statusCode !== 200) {
                            reject(response.statusCode);
                            return;
                        }
                        // 进度
                        const len = parseInt(res.headers['content-length']) // 文件总长度
                        let cur = 0
                        const total = (len / 1048576).toFixed(
                            2) // 转为M 1048576 - bytes in  1Megabyte
                        res.on('data', function (chunk) {
                            cur += chunk.length
                            const progress = (100.0 * cur / len).toFixed(2) // 当前进度
                            const currProgress = (cur / 1048576).toFixed(2) // 当前了多少
                            cb('data', progress, currProgress, total)
                        })
                        res.on('end', () => {
                            console.log('download end');
                        });

                        // 进度、超时等

                        file.on('finish', () => {
                            console.log('finish write file')
                            file.close(resolve);
                        }).on('error', (err) => {
                            fs.unlink(dest);
                            reject(err.message);
                        })

                        res.pipe(file);
                    });
                });
            },
            search() {
                if (this.searchVal == '') {
                    this.$message({
                        showClose: true,
                        center: true,
                        message: '请输入内容!'
                    });
                    return
                }
                this.searchCurrPage = 1;
                this.isSearch = true;
                this.searchLoading = true;
                req.searchPhoto(this.searchVal, this.searchCurrPage, 21).then(resp => {
                    let list = [];
                    list = list.concat(resp.results)
                    this.listImg = list;
                    this.searchLoading = false;
                }).catch(err => {
                    this.searchLoading = false;
                });
            },
            index() {
                this.isSearch = false;
                this.loading = true;
                this.currPage = 1;
                req.getCollection(this.collctionId, this.currPage, 21).then(resp => {
                    this.listImg = resp;
                    this.loading = false;
                })
            },
            toTop() {
                window.scrollTo(0, 0)
            },

        }
    }
</script>

<style lang="scss" scoped>
    @import "@/assets/css/index";
</style>