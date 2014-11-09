/**古代战争
 * 作者：YYC
 * 日期：2014-02-03
 * 电子邮箱：395976266@qq.com
 * QQ: 395976266
 * 博客：http://www.cnblogs.com/chaogex/
 */
(function () {
    var _instance = null;

    var LevelManager = YYC.Class({
        Private: {
            _isFinishLevel: function () {
                return this.currentLevel === levelData.length - 1;
            },
            _resetLevel: function () {
                YE.LoaderManager.getInstance().reset();
            },
            _getLevelResource: function () {
                var data = this.getLevelData(),
                    resource = [];

                if (resourceTable.common) {
                    resource = resource.concat(resourceTable.common);
                }

                for (var i in data.requirements) {
                    if (data.requirements.hasOwnProperty(i)) {
                        if (YYC.Tool.judge.isArray(data.requirements[i])) {
                            if (resourceTable[i].common) {
                                resource = resource.concat(resourceTable[i].common);
                            }

                            data.requirements[i].forEach(function (item) {
                                resource = resource.concat(resourceTable[i][item]);
                            });
                        }
                        else {
                            resource = resource.concat(resourceTable[i]);
                        }
                    }
                }

                //加入地图元素
                resource = resource.concat(resourceTable.map);

                return resource;
            }
        },
        Public: {
            currentLevel: 0,

            start: function () {
                this.currentLevel = 0;

                this.startCurrentLevel();
            },
//        start: function () {
//            $("#loading").hide();
//            $("#gameArea").show();
//
//            var game = YE.Director.getInstance();
//
//            game.runWithScene(new Scene());
//        },
            getLevelData: function () {
                return  levelData[this.currentLevel];
            },
            startCurrentLevel: function () {
                var loaderManager = YE.LoaderManager.getInstance();

                this._resetLevel();

                ui.showLevelBrif(this.getLevelData().brief);

                loaderManager.onloading = function (currentLoad, resCount) {
                    ui.showLoadingMessage("正在加载第" + currentLoad + "/" + resCount + "个资源");
                };
                loaderManager.onload = function () {
                    ui.showLoadingMessage("正在初始化动画");

                    YE.FrameCache.getInstance().addFrameData("arrow_json", "arrow_image");
                    YE.AnimationCache.getInstance().addAnimWithFile("anim_arrow_json");

                    YE.FrameCache.getInstance().addFrameData("archer_json", "archer_image");
                    YE.AnimationCache.getInstance().addAnimWithFile("anim_archer_json");

                    YE.FrameCache.getInstance().addFrameData("farmer_json", "farmer_image");
                    YE.AnimationCache.getInstance().addAnimWithFile("anim_farmer_json");

                    YE.FrameCache.getInstance().addFrameData("buildingEffect_json", "buildingEffect_image");
                    YE.AnimationCache.getInstance().addAnimWithFile("anim_buildingEffect_json");

                    //延迟50ms执行，从而在显示"正在初始化弓箭手和农民动画"后再执行初始化；
                    //如果不延迟，初始化会阻塞ui线程，从而“ui.showLoadingMessage("正在初始化弓箭手和农民动画");”会在完成初始化后才执行
                    setTimeout(function () {
                        var animPool = AnimPool.getInstance();

                        animPool.initWithFile("anim_archer_json");
                        animPool.initWithFile("anim_arrow_json");
                        animPool.initWithFile("anim_farmer_json");
                        animPool.initWithFile("anim_buildingEffect_json");

//
                        ui.showEnterGame();
                    }, 50);
                };

                loaderManager.preload(this._getLevelResource());
            },
            enterGame: function () {
                var triggers = this.getLevelData().triggers,
                    i = 0;

                //先让游戏进程运行一段时间，绘制出画面，然后再显示画面
//                setTimeout(function () {
                ui.showGameArea();
//                }, 500);

                YE.Director.getInstance().runWithScene(new Scene());

                for (i = triggers.length - 1; i >= 0; i--) {
                    this.initTrigger(triggers[i]);
                }
            },
            endLevel: function (success) {
                this.exit();

//                game.running = false;

                if (success) {
                    YE.SoundManager.getInstance().play("win");

                    if (this._isFinishLevel()) {
                        ui.showMessageBox("已完成所有关卡", function () {
                            ui.showIndex();
                        });
                    }
                    else {
                        ui.showMessageBox("完成关卡！进入下一关", function () {
                            ui.showLoading();
                            LevelManager.getInstance().currentLevel++;
                            LevelManager.getInstance().startCurrentLevel();
                        });
                    }
                }
                else {
                    YE.SoundManager.getInstance().play("lose");

                    ui.showMessageBox("结束游戏", function () {
                        ui.showIndex();
                    });
//                    ui.showMessageBox("Mission Failed.<br><br>Try again?", function () {
//                        $('.gamelayer').hide();
//                        singleplayer.startCurrentLevel();
//                    }, function () {
//                        $('.gamelayer').hide();
//                        $('#gamestartscreen').show();
//                    });
                }
            },
            exit: function () {
                var i = 0,
                    triggers = this.getLevelData().triggers;

                YE.Director.getInstance().end();

                if (triggers) {
                    for (i = triggers.length - 1; i >= 0; i--) {
                        this.clearTrigger(triggers[i]);
                    }
                }
            },
            initTrigger: function (trigger) {
                var self = this;

                if (trigger.type == "timed") {
                    trigger.timeoutHandler = setTimeout(function () {
                        self.runTrigger(trigger);
                    }, trigger.time)
                }
                else if (trigger.type == "conditional") {
                    trigger.intervalHandler = setInterval(function () {
                        self.runTrigger(trigger);
                    }, trigger.interval || 1000)
                }
            },
            runTrigger: function (trigger) {
                if (trigger.type == "timed") {
                    if (trigger.repeat) {
                        this.initTrigger(trigger);
                    }
                    trigger.action(trigger);
                }
                else if (trigger.type == "conditional") {
                    if (trigger.condition()) {
                        this.clearTrigger(trigger);
                        trigger.action(trigger);
                    }
                }
            },
            clearTrigger: function (trigger) {
                if (trigger.type == "timed") {
                    clearTimeout(trigger.timeoutHandler);
                }
                else if (trigger.type == "conditional") {
                    clearInterval(trigger.intervalHandler);
                }
            }
        },
        Static: {
            getInstance: function () {
                if (_instance === null) {
                    _instance = new this();
                }
                return _instance;
            }
        }
    });

    window.LevelManager = LevelManager;
}());