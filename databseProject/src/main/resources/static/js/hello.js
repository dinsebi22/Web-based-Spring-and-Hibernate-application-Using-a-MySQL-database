var Scene = {

    alpha: 1,

    elements: [],

    init: function () {
        this.canvas = document.querySelector('canvas');
        this.context = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.setAttribute('width', this.width + 'px');
        this.canvas.setAttribute('height', this.height + 'px');
        this.lastTime = Date.now();
        this.main();
        this.initHandler();
    },

    initHandler: function () {
        var that = this;
        var wasDown = false;
        var wasClick = false;
        this.canvas.addEventListener('mousedown', function (e) {
            wasDown = true;
            wasClick = true;
            that.dragHandler('startDrag', e);
        });

        window.addEventListener('mouseup', function (e) {
            wasDown = false;
            that.dragHandler('stopDrag', e);
        });

        window.addEventListener('mousemove', function (e) {
            if (!wasDown) {
                return;
            }
            that.dragHandler('drag', e);
        });

        setTimeout(function () {
            if (!wasClick) {
                //that.unpin();
            }
        }, 4000);

    },

    unpin: function () {
        for (var i = 0, len = this.elements.length; i < len; ++i) {
            var element = this.elements[i];
            element.unpin();
        }
    },

    dragHandler: function (callbackName, e) {
        for (var i = 0, len = this.elements.length; i < len; ++i) {
            var element = this.elements[i];
            if (element.isDraggable && element.isDraggable()) {
                this.elements[i][callbackName](e.clientX, e.clientY);
            }
        }
    },

    main: function () {
        var now = Date.now();
        var dt = (now - this.lastTime) / 1e4;
        var that = this;

        this.update(dt);
        this.render();
        this.lastTime = now;
        requestAnimationFrame(function () {
            that.main();
        });
    },

    getActiveBall: function () {

    },

    addElement: function (element) {
        this.elements.push(element);
    },

    getElements: function () {
        return this.elements;
    },

    addElements: function (elements) {
        Array.prototype.push.apply(this.elements, elements);
    },

    getBall: function () {
        return this.ball;
    },

    addBall: function (ball) {
        this.ball = ball;
        this.elements.push(ball);
    },

    removeElement: function (element) {
        for (var i = 0, len = this.elements.length; i < len; ++i) {
            if (this.elements[i] == element) {
                this.elements.splice(i, 1);
                --len;
            }
        }
    },

    removeElements: function () {
        this.elements = [];
    },

    update: function (dt) {
        for (var i = 0, len = this.elements.length; i < len; ++i) {
            this.elements[i].update(dt);
        }
    },

    render: function () {
        this.context.clearRect(0, 0, this.width, this.height);
        for (var i = 0, len = this.elements.length; i < len; ++i) {
            this.elements[i].draw(this.context);
        }
    }
};
var utils = {

    distance: function (p0, p1) {
		return Math.sqrt((p0.x - p1.x) * (p0.x - p1.x) + (p0.y - p1.y) * (p0.y - p1.y));
    }
};
var yGravity = 0.3;
var xGravity = 0;

var SoftObject = {

    friction: 1,

    updatePoints: function (stopUpdate, getGravityCoef) {
        var stopUpdate = stopUpdate || function () {};
        var getGravityCoef = getGravityCoef || function () { return 1; };

		for (var i = 0, len = this.points.length; i < len; ++i) {
			var point = this.points[i];
			if (point.pinned || stopUpdate(i, len)) {
				continue;
			}
			var vx = (point.x - point.oldX) * this.friction;
			var vy = (point.y - point.oldY) * this.friction;

			point.oldX = point.x;
			point.oldY = point.y;
			point.x += vx;
			point.y += vy;

			point.y += yGravity * getGravityCoef();
			point.x += xGravity * getGravityCoef();
		}
 	},

    updateSticks: function (stopP1Update) {
        var stopP1Update = stopP1Update || function () {};
	    for (var i = 0, len = this.sticks.length; i < len; ++i) {
		    var stick = this.sticks[i];
			if (stick.hidden) {
				if (!stick.p0.adjacent) {
					stick.p0.radius = 0;
				}
				if (!stick.p1.adjacent) {
					stick.p1.radius = 0;
				}
			}
		    var dx = stick.p1.x - stick.p0.x;
		    var dy = stick.p1.y - stick.p0.y;
		    var distance = Math.sqrt(dx * dx + dy * dy);
		    var diff = distance - stick.length;
		    var percent = diff / 2 / distance;
		    var offsetX = dx * percent;
		    var offsetY = dy * percent;

		    if (!stick.p0.pinned) {
			    stick.p0.x += offsetX;
			    stick.p0.y += offsetY;
		    }
		    if (!stopP1Update(i, len) && !stick.p1.pinned) {
			    stick.p1.x -= offsetX;
			    stick.p1.y -= offsetY;
		    }
	    }
    },

    drawPoints: function () {
		for (var i = 0, len = this.points.length; i < len; ++i) {
			var point = this.points[i];
			if (!point.radius) {
				continue;
			}
			this.context.beginPath();
			this.context.arc(point.x, point.y, point.radius, 0, 2 * Math.PI);
			this.context.fill();
		}
	},

    drawSticks: function () {
		this.context.beginPath();
		for (var i = 0, len = this.sticks.length; i < len; ++i) {
			var stick = this.sticks[i];
			if (stick.hidden) {
				continue;
			}
            this.context.moveTo(stick.p0.x, stick.p0.y);
			this.context.lineTo(stick.p1.x, stick.p1.y);
		}
		this.context.stroke();
	}
};
'use strict';
var Rope = {

    create: function (x, y, color) {
        var rope = Object.create(this);
        rope.color = color;
        rope.points = [];
        rope.sticks = [];
        rope.x = x;
        rope.y = y;
        for (var p in SoftObject) {
            rope[p] = SoftObject[p];
        }
        rope.build();
        return rope;
    },

    isDraggable: function () {
        return true;
    },

    getMaxLength: function () {
        return 10 * init.letterHeight;
    },

    getRopeLength: function () {
        return 1.2 * init.letterHeight;
    },

    getActualLength: function () {
        var endLine = {x: this.x, y: this.y};
        var dx = endLine.x - this.draggablePoint.x;
        var dy = endLine.y - this.draggablePoint.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    build: function () {
        var pointCount = 11;
        var step = this.getRopeLength() / pointCount;
        for (var i = 0; i < pointCount; ++i) {
            var currentStep = -i * step;
            this.points.push({
                x: this.x,
                y: this.y + currentStep,
                oldX: this.x,
                oldY: this.y + currentStep,
                radius: init.lineWidth / 2
            });
        }

        this.points[0].pinned = true;
        this.draggablePoint = this.points[pointCount - 1];

        for (var i = 0; i < pointCount - 1; ++i) {
            this.sticks.push({
                p0: this.points[i],
                p1: this.points[i + 1],
                length: utils.distance(this.points[i], this.points[i + 1])
            });
        }
    },

    startDrag: function (x, y) {
        var k = 4;
        if (Math.abs(this.draggablePoint.x - x) <= k * this.draggablePoint.radius &&
            Math.abs(this.draggablePoint.y - y) <= k * this.draggablePoint.radius) {
            this.canDrag = true;
        }
    },

    drag: function (x, y) {
        if (!this.canDrag) {
            return;
        }
        var firstPoint = this.points[0];
        var dx = x - firstPoint.x;
        var dy = y - firstPoint.y;
        var len = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        if (len <= this.getMaxLength()) {
            this.draggablePoint.x = x;
            this.draggablePoint.y = y;
        } else {
            var angle = Math.atan2(dy, dx);
            var nx = Math.cos(angle) * this.getMaxLength();
            var ny = Math.sin(angle) * this.getMaxLength();
            this.draggablePoint.x = firstPoint.x + nx;
            this.draggablePoint.y = firstPoint.y + ny;
        }
    },

    unpin: function () {
        for (var i = 0, len = this.points.length; i < len; ++i) {
            var point = this.points[i];
            point.pinned = false;
        }
    },

    stopDrag: function () {
       this.canDrag = false;
    },

    update: function () {
        var that = this;
        for (var i = 0; i < 1; ++i) {
            this.updatePoints(function (i, len) {
                return that.canDrag && i == len - 1;
            }, function () {
                var k = Math.min(1, that.getRopeLength() / that.getActualLength());
                if (that.getActualLength() >= that.getMaxLength()) {
                    k = 0;
                }
                return k;
            });
            this.updateSticks(function (i, len) {
                return that.canDrag && i == len - 1;
            });
        }
    },

    draw: function (context) {
        this.context = context;
		this.context.save();
        this.context.globalCompositeOperation = "difference";
        this.context.lineWidth = init.lineWidth;
        this.context.fillStyle = this.color;
        this.context.strokeStyle = this.color;

        this.drawPoints();
        this.drawSticks();
        this.context.restore();
    }
};
function init () {
        var basisHeight = 400;
        var basisWidth = 1100;
        var kx = Math.min(0.8, window.innerWidth / basisWidth);
        var ky = Math.min(0.8, window.innerHeight / basisHeight);
        var k = Math.min(kx, ky);

        var countPoints = 10;
        init.letterHeight = 150 * k;
        var letterWidth = 120 * k;
        init.lineWidth = 30 * k;
        var letterSpacing = 70 * k;
        var xOffset = (window.innerWidth - 5 * letterWidth - 4 * letterSpacing) / 2;
        var y = (window.innerHeight - init.letterHeight * 1.5) / 2;


	    init.H = H;
	    init.E = E;
	    init.L = L;
	    init.O = O;

        function H (color, pos) {
            var s1 = Rope.create(xOffset + pos * letterSpacing + pos * letterWidth, y, color);
            var s2 = Rope.create(xOffset + pos * letterSpacing + (pos + 1) * letterWidth, y, color);
            Scene.addElements([
                s1,
                s2
            ]);

            s1.points[countPoints / 2].adjacent = true;
            s2.points[countPoints / 2].adjacent = true;
            s1.sticks.push({
                p0: s1.points[countPoints / 2],
                p1: s2.points[countPoints / 2],
                length: utils.distance(s1.points[countPoints / 2], s2.points[countPoints / 2])
            });
            H.s1 = s1;
        }

        function E (color, pos) {
            var s1 = Rope.create(xOffset + pos * letterSpacing + pos * letterWidth, y, color);
            var s2 = Rope.create(xOffset + pos * letterSpacing + (pos + 1) * letterWidth, y, color);
            Scene.addElements([
                s1,
                s2
            ]);

            s2.sticks.forEach(function (item) {
                item.hidden = true;
            });

            s1.points[0].adjacent = true;
            s2.points[0].adjacent = true;
            s1.points[countPoints / 2].adjacent = true;
            s2.points[countPoints / 2].adjacent = true;
            s1.points[countPoints].adjacent = true;
            s2.points[countPoints].adjacent = true;

            s1.sticks.push({
                p0: s1.points[0],
                p1: s2.points[0],
                adjacent: true,
                length: utils.distance(s1.points[0], s2.points[0])
            });

            s1.sticks.push({
                p0: s1.points[countPoints / 2],
                p1: s2.points[countPoints / 2],
                adjacent: true,
                length: utils.distance(s1.points[countPoints / 2], s2.points[countPoints / 2])
            });

            s1.sticks.push({
                p0: s1.points[countPoints],
                p1: s2.points[countPoints],
                adjacent: true,
                length: utils.distance(s1.points[countPoints], s2.points[countPoints])
            });

	        E.s1 = s1;
        }

        function L (color, pos) {
            var s1 = Rope.create(xOffset + pos * letterSpacing + pos * letterWidth, y, color);
            var s2 = Rope.create(xOffset + pos * letterSpacing + (pos + 1) * letterWidth, y, color);
            Scene.addElements([
                s1,
                s2
            ]);

            s2.sticks.forEach(function (item) {
                item.hidden = true;
            });

            s1.points[countPoints].adjacent = true;
            s2.points[countPoints].adjacent = true;
            s1.sticks.push({
                p0: s1.points[countPoints],
                p1: s2.points[countPoints],
                adjacent: true,
                length: utils.distance(s1.points[countPoints], s2.points[countPoints])
            });

	        L.s1 = s1;
        }

        function O (color, pos) {
            var s1 = Rope.create(xOffset + pos * letterSpacing + pos * letterWidth, y, color);
            var s2 = Rope.create(xOffset + pos * letterSpacing + (pos + 1) * letterWidth, y, color);
            Scene.addElements([
                s1,
                s2
            ]);

            s1.points[0].adjacent = true;
            s2.points[0].adjacent = true;
            s1.points[countPoints].adjacent = true;
            s2.points[countPoints].adjacent = true;
            s1.sticks.push({
                p0: s1.points[0],
                p1: s2.points[0],
                adjacent: true,
                length: utils.distance(s1.points[0], s2.points[0])
            });

            s1.sticks.push({
                p0: s1.points[countPoints],
                p1: s2.points[countPoints],
                adjacent: true,
                length: utils.distance(s1.points[countPoints], s2.points[countPoints])
            });

	        O.s1 = s1;
        }

        var interval = 0;
        setTimeout(function () {
            H('#FF4136', 0);
        }, 0);
        setTimeout(function () {
            E('#0074D9', 1);
        }, interval);
        setTimeout(function () {
            L('#FFDC00', 2);
        }, 2 * interval);
        setTimeout(function () {
            L('#2ECC40', 3);
        }, 3 * interval);
        setTimeout(function () {
            O('#39CCCC', 4);
        }, 4 * interval);

        setTimeout(function () {
            init.H.s1.points[countPoints].x = init.H.s1.points[countPoints].x / 2;
	        init.E.s1.points[countPoints].x = init.E.s1.points[countPoints].x / 2;
	        init.L.s1.points[countPoints].x = 3 * init.L.s1.points[countPoints].x / 2;
	        init.O.s1.points[countPoints].x = 3 * init.O.s1.points[countPoints].x / 2;
        }, 8 * interval);

        Scene.init();
    }
    init();