/**
 * Created by xianrongbin on 2017/4/27.
 */
(function (win, doc, $) {
    /**
     * 滑块移动距离：滑块可移动的距离=内容滚动高度：内容可滚动高度
     *
     * 1、鼠标移动距离=滑块移动距离
     * 2、滑块可移动距离，去获得内容可以滚动高度
     * 3、内容滚动高度，去获得滑块位置
     * */

    /**
     * 鼠标滚轮事件
     * 火狐 DOMMouseScroll  使用 event.orginal.detail属性值，负数向上，大小是 +-3
     * 其他 mousewheel 使用 event.orgin.wheeldelta 属性值，正数向上,大小是 +-120
     * */
    function CusScrollBar(options) {
        this._init(options);
    }

    $.extend(CusScrollBar.prototype, {
        _init: function (options) {
            var self = this;
            self.options = {
                scrollDir: 'Y',
                contentSelector: '',
                barSelector: '',
                wheelStep: 10,
                tabItemSelector: '.tab-item', //标题选择器
                tabActiveClass: 'tab-active', //选中标签类名,注意这里没有类名的.
                anchorSelector: '.anchor'//锚点选择器
            };

            $.extend(true, self.options, options || {});
            self._initDomEvent();
            return self;
        },
        _initDomEvent: function () {
            var opts = this.options;
            this.$cont = $(opts.contentSelector);
            this.$slider = $(opts.sliderSelector);
            this.$bar = opts.barSelector ? $(opts.barSelector) : self.$slider.parent();

            this.$doc = $(doc);

            this.$tabItem = $(opts.tabItemSelector);
            this.$anchor= $(opts.anchorSelector);
            this._initSliderDragEvent();
            this._bindMouseWheel();//滑轮
            this._bindContentScroll();

            this._initTabEvent();
        },
        _initSliderDragEvent: function () {
            //滑块拖动功能
            var self = this;
            var slider = this.$slider,
                sliderEl = slider[0],
                dragStartPagePosition,
                dragStartScrollPosition,
                dragContBarRate;

            function mousemoveHandler(e) {
                e.preventDefault();
                if (dragStartPagePosition == null) {
                    return;
                }

                self.scrollTo(dragStartScrollPosition + (e.pageY - dragStartPagePosition) * dragContBarRate);
            }

            if (sliderEl) {
                var doc = this.$doc;

                slider.on('mousedown', function (e) {
                    e.preventDefault();
                    dragStartPagePosition = e.pageY;
                    dragStartScrollPosition = self.$cont[0].scrollTop;
                    /**
                    滚动条类似于一种杠杠的东西
                    滑块可滚动的高度与内容区域可滚动的高度有一定的比例关系
                    根据 滑动滑动的距离，可以计算出 内容区域滚动的距离
                    */
                    var maxContentScroll = self.getMaxContentScrollHight();
                    var MaxSliderScroll = self.getMaxSliderScrollHeight();
                    dragContBarRate = maxContentScroll / MaxSliderScroll;

                    doc.on('mousemove.scroll', mousemoveHandler).on('mouseup.scroll', function () {
                        doc.off('.scroll');
                    });
                });
            }
        },
        _initTabEvent: function () {
            //初始化每个tab点击事件，
            var self = this;
            self.$tabItem.on('click', function (e) {
                e.preventDefault();
                var index = $(this).index();
                self.changeTabSelect(index);

                self.scrollTo(self.$cont[0].scrollTop + self.getAnchorPosition(index));
            });
        },
        changeTabSelect: function (index) {
            //改变tab点击时样式
            var self = this,
                activeClass = self.options.tabActiveClass;
            self.$tabItem.removeClass(activeClass).eq(index).addClass(activeClass);
        },

        getAnchorPosition: function(index) {
            //每个tab与 .scroll-ol 都有固定的关系，每个.scroll都充满了100%,即使内容不足以占据整个视图，这里即300px
            return this.$anchor.eq(index).position().top;
        },

        getAllAnchorPosition: function() {
            //存在tab与.scroll-ol 顶部距离，一一对应
            var self = this,
                allPositonArr = [];
            for (var i = 0; i < self.$anchor.length; i++) {
                allPositonArr.push(self.$cont[0].scrollTop + self.getAnchorPosition(i))
            }
            return allPositonArr;
        },
        getMaxContentScrollHight: function () {
            //内容可滚动的高度
            var self = this;
            var contHeight = self.$cont.height();
            var scrollHeight = self.$cont[0].scrollHeight;
            /**
             * 可滚动的高度=max[可显示的高度，内容高度]-[可显示的高度]，即剩余的高度
             */
            return Math.max(contHeight, scrollHeight) - contHeight;
        },
        getMaxSliderScrollHeight: function () {
            //滑块可滑动的距离
            //滚动条的高度-滑块的高度
            var self = this;
            return self.$bar.height() - self.$slider.height();
        },
        getSliderPosition: function () {
            //内容区域距离顶部/最大滑动高度（内容区域高度）=滑块距离顶部/滑块最大滑动距离
            var self = this,
                maxSliderPosition = self.getMaxSliderScrollHeight();
            return Math.min(maxSliderPosition, (self.$cont[0].scrollTop / self.getMaxContentScrollHight()) * maxSliderPosition);
        },
        _bindMouseWheel: function () {
            var self = this;
            // on监听事件，多个事件利用空格分开
            self.$cont.on('mousewheel DOMMouseScroll', function (e) {
                e.preventDefault();
                // 判断原生事件对象的属性
                var oEv = e.originalEvent,
                    wheelRange = oEv.wheelDelta ? -oEv.wheelDelta / 120 : (oEv.detail || 0) / 3;
                // 调用scrollTo方法。
                self.scrollTo(self.$cont[0].scrollTop + wheelRange * self.options.wheelStep)
            });
        },
        _bindContentScroll: function () {
            //绑定展示内容，计算滑块的距离顶部的位置、
            var self = this;
            self.$cont.on('scroll', function () {
                var sliderEl = self.$slider && self.$slider[0];
                if (sliderEl) {
                    sliderEl.style.top = self.getSliderPosition() + 'px';
                }
            });
        },
        scrollTo: function (positionVal) {
            var self = this;
            var posArr = self.getAllAnchorPosition();
            len = posArr.length;

            /**
            * 估计定了每个tab与 .scroll-ol 的所在高度的比例
            * */
            function getIndex(positionVal) {
                for (var i = len-1; i >= 0; i--) {
                    if (positionVal >= posArr[i]) {
                        // 判断条件，当scrolltop的值大于锚点定位的位置，则表示内容在那个锚点范围里面。
                        return i;
                    }
                }
            }

            if (posArr.length === self.$tabItem.length) {
                // 标签选择事件
                self.changeTabSelect(getIndex(positionVal));
            }
            self.$cont.scrollTop(positionVal);
        }
    });

    win.CusScrollBar = CusScrollBar;
})(window, document, jQuery);
