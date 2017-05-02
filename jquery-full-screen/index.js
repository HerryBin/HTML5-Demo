/**
 * Created by xianrongbin on 2017/5/1.
 */
(function ($) {


    $.fn.PageSwitch = function (options) {
        let self = $(this),
            instance = self.data('PageSwitch');
        if (!instance) {
            self.data('PageSwitch', (new PageSwitch(self, options)));
        }
    };

    //默认配置参数项 不能写在最顶部
    $.fn.PageSwitch.defaults = {
        selectors: {
            sections: '.sections',
            section: '.section',
            page: '.pages',
            active: '.active'
        },
        index: 0,
        easing: 'ease',
        direction: 'horizontal',//横屏 vertical  竖屏horizontal
        pagination: true,
        duration: 500
    };

    let PageSwitch = (function () {

        /**
         * 构造函数，初始化插件信息
         * */
        function PageSwitch(element, options) {
            this.settings = $.extend(true,
                $.fn.PageSwitch.defaults, options || {}
            );

            this.element = element;
            this.init();
        }

        PageSwitch.prototype = {
            init: function () {
                let self = this;

                self.selectors = self.settings.selectors;
                /***
                 *  包裹最外层的section
                 *  <div sections
                 *      <div section
                 */

                self.sections = self.element.find(self.selectors.sections);
                self.section = self.element.find(self.selectors.section);

                //竖屏true 横屏 false
                self.direction = self.settings.direction == "vertical";
                self.pagesCount = self.getPagesCount();
                self.index = 0;
                self.canscroll = true;
                //初始化右侧点击按钮
                if (!self.direction || self.index) {
                    //横屏处理
                    self._initLayout();
                } else {
                    //竖屏处理

                }

                this._initPaging();
                this._initEvent();
            },
            _initLayout: function () {
                let self = this;
                if (!self.direction) {
                    let width = (self.pagesCount * 100) + "%",
                        cellWidth = (100 / self.pagesCount).toFixed(2) + "%";
                    self.sections.width(width);
                    self.section.width(cellWidth).css("float", "left");
                }

            },
            _initPaging: function () {
                //初始化页面按钮
                let self = this,
                    pageCalss = self.selectors.page.substring(1);

                //获取点击后的样式
                self.activeClass = self.selectors.active.substring(1);

                let pageHtml = '<ul class=' + pageCalss + '>';
                for (let i = 0; i < self.pagesCount; i++) {
                    pageHtml += '<li></li>';
                }
                pageHtml += '</ul>';
                self.element.append(pageHtml);

                /**
                 * 动态创建的 圆形图案
                 *  如果是竖屏，则在右侧
                 *  如果是横屏 则在下方
                 */
                let pages = self.element.find(self.selectors.page);
                self.pageItem = pages.find('li');
                self.pageItem.eq(self.index).addClass(self.activeClass);

                if (self.direction) {
                    pages.addClass('vertical');
                } else {
                    pages.addClass('horizontal');
                }

                //上下按钮
                $(window).keydown(function (e) {
                    let keyCode = e.keyCode;
                    if (keyCode === 37 || keyCode === 38) {
                        self.prev();
                    } else if (keyCode === 39 || keyCode === 40) {
                        self.next();
                    }
                });
            },
            _initEvent: function () {
                let self = this;

                self.element.on('mousewheel DOMMouseScroll', function (e) {
                    e.preventDefault();

                    /**
                     * 鼠标滚轮事件
                     * 火狐 DOMMouseScroll  使用 event.orginal.detail属性值，负数向上，大小是 +-3
                     * 其他 mousewheel 使用 event.orgin.wheeldelta 属性值，正数向上,大小是 +-120
                     * */
                    if (!self.canscroll) {
                        return;
                    }
                    let delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
                    if (delta > 0 && self.index) {
                        self.prev();
                    } else if (delta < 0 && (self.index < (self.pagesCount - 1))) {
                        //向下 且 没超出最大页
                        self.next();
                    }
                });

                //点击 切换按钮
                self.element.on('click', self.selectors.page + " li", function () {
                    self.index = $(this).index();
                    self._scrollPage();
                });

                self.sections.on("transitionend webkitTransitionEnd oTransitionEnd", function () {
                    self.canscroll = true;
                    if (self.settings.callback && $.type(self.settings.callback) === "function") {
                        self.settings.callback();
                    }
                })
            },
            _scrollPage: function (init) {
                let self = this,
                    dest = self.section.eq(self.index).position();

                if (!dest) {
                    return;
                }

                self.canscroll = false;

                let translate = self.direction ? 'translateY(-' + dest.top + 'px)' : 'translateX(-' + dest.left + 'px)';
                self.sections.css("transition", "all " + self.settings.duration + "ms " + self.settings.easing);
                self.sections.css('transform', translate);

                if (self.settings.pagination && !init) {
                    self.pageItem.eq(self.index).addClass(self.activeClass).siblings("li").removeClass(self.activeClass);
                }
            },
            prev: function () {
                let self = this;
                if (self.index > 0) {
                    self.index--;
                }

                self._scrollPage();
            },
            next: function () {
                let self = this;
                if (self.index < self.pagesCount) {
                    self.index++;
                }
                self._scrollPage();
            },
            getPagesCount: function () {
                return this.section.length;
            }
        };

        return PageSwitch;
    })();


    $(function () {
        $('[data-PageSwitch]').PageSwitch();
    });
})(jQuery);